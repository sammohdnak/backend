import { Address, Hex, parseEther, parseUnits } from 'viem';
import { MAX_UINT256, SwapKind, Token, TokenAmount, WAD } from '@balancer/sdk';
import { AddKind, RemoveKind, Vault, Weighted, WeightedState, HookState } from '@balancer-labs/balancer-maths';
import { Chain } from '@prisma/client';

import { PrismaPoolAndHookWithDynamic } from '../../../../../../prisma/prisma-types';
import { GqlPoolType } from '../../../../../../apps/api/gql/generated-schema';
import { TokenPairData } from '../../../../../sources/contracts/v3/fetch-tokenpair-data';
import { chainToChainId as chainToIdMap } from '../../../../../network/chain-id-to-chain';

import { BasePoolV3 } from '../../poolsV2/basePool';
import { WeightedBasePoolToken } from '../../poolsV2/weighted/weightedBasePoolToken';
import { WeightedErc4626PoolToken } from './weightedErc4626PoolToken';

import { getHookState, isLiquidityManagement } from '../../utils/helpers';

import { LiquidityManagement } from '../../../../../sor/types';

type WeightedPoolToken = WeightedBasePoolToken | WeightedErc4626PoolToken;

export class WeightedPoolV3 implements BasePoolV3 {
    public readonly chain: Chain;
    public readonly id: Hex;
    public readonly address: string;
    public readonly poolType: GqlPoolType = 'WEIGHTED';
    public readonly poolTypeVersion: number;
    public readonly swapFee: bigint;
    public readonly totalShares: bigint;
    public readonly tokens: WeightedPoolToken[];
    public readonly tokenPairs: TokenPairData[];
    public readonly MAX_IN_RATIO = 300000000000000000n; // 0.3
    public readonly MAX_OUT_RATIO = 300000000000000000n; // 0.3
    public readonly hookState: HookState | undefined;
    public readonly liquidityManagement: LiquidityManagement;

    private readonly tokenMap: Map<string, WeightedPoolToken>;

    private vault: Vault;
    private poolState: WeightedState;

    static fromPrismaPool(
        pool: PrismaPoolAndHookWithDynamic,
        underlyingTokens: { address: string; decimals: number }[],
    ): WeightedPoolV3 {
        const poolTokens: WeightedPoolToken[] = [];

        if (!pool.dynamicData) {
            throw new Error('No dynamic data for pool');
        }

        for (const poolToken of pool.tokens) {
            if (!poolToken.weight) {
                throw new Error('Weighted pool token does not have a weight');
            }

            const token = new Token(
                parseFloat(chainToIdMap[pool.chain]),
                poolToken.address as Address,
                poolToken.token.decimals,
                poolToken.token.symbol,
                poolToken.token.name,
            );
            const scale18 = parseEther(poolToken.balance);
            const tokenAmount = TokenAmount.fromScale18Amount(token, scale18);
            if (poolToken.token.underlyingTokenAddress) {
                const underlyingToken = underlyingTokens.find(
                    (token) => token.address === poolToken.token.underlyingTokenAddress,
                );
                if (underlyingToken) {
                    const unwrapRateDecimals = 18 - poolToken.token.decimals + underlyingToken.decimals;
                    // erc4626 token
                    poolTokens.push(
                        new WeightedErc4626PoolToken(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.priceRate),
                            parseUnits(poolToken.token.unwrapRate, unwrapRateDecimals),
                            poolToken.token.underlyingTokenAddress,
                            parseEther(poolToken.weight),
                        ),
                    );
                } else {
                    poolTokens.push(
                        new WeightedBasePoolToken(
                            token,
                            tokenAmount.amount,
                            poolToken.index,
                            parseEther(poolToken.weight),
                        ),
                    );
                }
            } else {
                poolTokens.push(
                    new WeightedBasePoolToken(token, tokenAmount.amount, poolToken.index, parseEther(poolToken.weight)),
                );
            }
        }

        //transform
        const hookState = getHookState(pool);

        return new WeightedPoolV3(
            pool.id as Hex,
            pool.address,
            pool.chain,
            pool.version,
            parseEther(pool.dynamicData.swapFee),
            parseEther(pool.dynamicData.totalShares),
            poolTokens,
            pool.dynamicData.tokenPairsData as TokenPairData[],
            pool.liquidityManagement as unknown as LiquidityManagement,
            hookState,
        );
    }

    constructor(
        id: Hex,
        address: string,
        chain: Chain,
        poolTypeVersion: number,
        swapFee: bigint,
        totalShares: bigint,
        tokens: WeightedPoolToken[],
        tokenPairs: TokenPairData[],
        liquidityManagement: LiquidityManagement,
        hookState: HookState | undefined = undefined,
    ) {
        this.chain = chain;
        this.id = id;
        this.poolTypeVersion = poolTypeVersion;
        this.address = address;
        this.swapFee = swapFee;
        this.totalShares = totalShares;
        this.tokens = tokens;
        this.tokenMap = new Map(tokens.map((token) => [token.token.address, token]));
        this.tokenPairs = tokenPairs;
        this.liquidityManagement = liquidityManagement;
        this.hookState = hookState;

        // add BPT to tokenMap, so we can handle add/remove liquidity operations
        const bpt = new Token(tokens[0].token.chainId, this.id, 18, 'BPT', 'BPT');
        this.tokenMap.set(bpt.address, new WeightedBasePoolToken(bpt, totalShares, -1, 0n));

        this.vault = new Vault();
        this.poolState = this.getPoolState(hookState?.hookType);
    }

    public getNormalizedLiquidity(tokenIn: Token, tokenOut: Token): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        const tokenPair = this.tokenPairs.find(
            (tokenPair) =>
                (tokenPair.tokenA === tIn.token.address && tokenPair.tokenB === tOut.token.address) ||
                (tokenPair.tokenA === tOut.token.address && tokenPair.tokenB === tIn.token.address),
        );

        if (tokenPair) {
            return BigInt(tokenPair.normalizedLiquidity);
        }
        return 0n;
    }

    public getLimitAmountSwap(tokenIn: Token, tokenOut: Token, swapKind: SwapKind): bigint {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        // remove liquidity
        if (tIn.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenRemoveAmount(
                {
                    isExactIn: swapKind === SwapKind.GivenIn,
                    totalSupply: this.poolState.totalSupply,
                    tokenOutBalance: this.poolState.balancesLiveScaled18[tOut.index],
                    tokenOutScalingFactor: this.poolState.scalingFactors[tOut.index],
                    tokenOutRate: this.poolState.tokenRates[tOut.index],
                },
                this.poolState,
            );
        }
        // add liquidity
        if (tOut.token.isSameAddress(this.id)) {
            return this.vault.getMaxSingleTokenAddAmount(this.poolState);
        }
        // swap
        return this.vault.getMaxSwapAmount(
            {
                swapKind,
                balancesLiveScaled18: this.poolState.balancesLiveScaled18,
                tokenRates: this.poolState.tokenRates,
                scalingFactors: this.poolState.scalingFactors,
                indexIn: tIn.index,
                indexOut: tOut.index,
            },
            this.poolState,
        );
    }

    public swapGivenIn(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { amountsOutRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? 1n : 0n)),
                    maxBptAmountInRaw: swapAmount.amount,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_IN,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = amountsOutRaw[tOut.index];
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { bptAmountOutRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? swapAmount.amount : 0n)),
                    minBptAmountOutRaw: 0n,
                    kind: AddKind.UNBALANCED,
                },
                this.poolState,
                this.hookState,
            );
            calculatedAmount = bptAmountOutRaw;
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenIn,
                },
                this.poolState,
                this.hookState,
            );
        }
        return TokenAmount.fromRawAmount(tOut.token, calculatedAmount);
    }

    public swapGivenOut(tokenIn: Token, tokenOut: Token, swapAmount: TokenAmount): TokenAmount {
        const { tIn, tOut } = this.getPoolTokens(tokenIn, tokenOut);

        let calculatedAmount: bigint;

        if (tIn.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // remove liquidity
            const { bptAmountInRaw } = this.vault.removeLiquidity(
                {
                    pool: this.id,
                    minAmountsOutRaw: this.poolState.tokens.map((_, i) => (i === tOut.index ? swapAmount.amount : 0n)),
                    maxBptAmountInRaw: MAX_UINT256,
                    kind: RemoveKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
            );
            calculatedAmount = bptAmountInRaw;
        } else if (tOut.token.isSameAddress(this.id)) {
            // if liquidityManagement.disableUnbalancedLiquidity is true return 0
            // as the pool does not allow unbalanced operations. 0 return marks the
            // route as truly unfeasible route.
            if (this.liquidityManagement.disableUnbalancedLiquidity) {
                return TokenAmount.fromRawAmount(tOut.token, 0n);
            }

            // add liquidity
            const { amountsInRaw } = this.vault.addLiquidity(
                {
                    pool: this.id,
                    maxAmountsInRaw: this.poolState.tokens.map((_, i) => (i === tIn.index ? MAX_UINT256 : 0n)),
                    minBptAmountOutRaw: swapAmount.amount,
                    kind: AddKind.SINGLE_TOKEN_EXACT_OUT,
                },
                this.poolState,
            );
            calculatedAmount = amountsInRaw[tIn.index];
        } else {
            // swap
            calculatedAmount = this.vault.swap(
                {
                    amountRaw: swapAmount.amount,
                    tokenIn: tIn.token.address,
                    tokenOut: tOut.token.address,
                    swapKind: SwapKind.GivenOut,
                },
                this.poolState,
            );
        }
        return TokenAmount.fromRawAmount(tIn.token, calculatedAmount);
    }

    public getPoolState(hookName?: string): WeightedState {
        const poolState: WeightedState = {
            poolType: 'WEIGHTED',
            poolAddress: this.address,
            swapFee: this.swapFee,
            balancesLiveScaled18: this.tokens.map((t) => t.scale18),
            tokenRates: this.tokens.map((_) => WAD),
            totalSupply: this.totalShares,
            weights: this.tokens.map((t) => t.weight),
            tokens: this.tokens.map((t) => t.token.address),
            scalingFactors: this.tokens.map((t) => t.scalar),
            aggregateSwapFee: 0n,
            supportsUnbalancedLiquidity: !this.liquidityManagement.disableUnbalancedLiquidity,
        };

        poolState.hookType = hookName;

        return poolState;
    }

    // Helper methods

    public getPoolTokens(tokenIn: Token, tokenOut: Token): { tIn: WeightedPoolToken; tOut: WeightedPoolToken } {
        const tIn = this.tokenMap.get(tokenIn.wrapped);
        const tOut = this.tokenMap.get(tokenOut.wrapped);

        if (!tIn || !tOut) {
            throw new Error('Pool does not contain the tokens provided');
        }

        return { tIn, tOut };
    }
}
