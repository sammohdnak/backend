import {
    GqlPoolMinimal,
    GqlSorCallData,
    GqlSorGetSwapPaths,
    GqlSorPath,
    GqlSorSwap,
    GqlSorSwapRoute,
    GqlSorSwapRouteHop,
    GqlSorSwapType,
    GqlSwapCallDataInput,
} from '../../../apps/api/gql/generated-schema';
import { Chain, Prisma, PrismaPoolType } from '@prisma/client';
import { PrismaPoolAndHookWithDynamic, prismaPoolAndHookWithDynamic } from '../../../prisma/prisma-types';
import { prisma } from '../../../prisma/prisma-client';
import { GetSwapsV2Input as GetSwapPathsInput } from '../types';
import { poolsToIgnore } from '../constants';
import { chainToChainId as chainToIdMap } from '../../network/chain-id-to-chain';
import * as Sentry from '@sentry/node';
import { Address, formatUnits } from 'viem';
import { sorGetPathsWithPools } from './lib/static';
import { poolService } from '../../pool/pool.service';
import { replaceZeroAddressWithEth } from '../../web3/addresses';
import { getToken, swapPathsZeroResponse } from '../utils';
import {
    BatchSwapStep,
    DEFAULT_USERDATA,
    SingleSwap,
    Slippage,
    Swap,
    SwapBuildOutputExactIn,
    SwapBuildOutputExactOut,
    TokenAmount,
    SwapKind,
    ExactInQueryOutput,
    ExactOutQueryOutput,
    VAULT,
} from '@balancer/sdk';
import { PathWithAmount } from './lib/path';
import { calculatePriceImpact, getInputAmount, getOutputAmount } from './lib/utils/helpers';
import { Cache } from 'memory-cache';
import config from '../../../config';
import { HookData } from '../../sources/transformers';

class SorPathService {
    private cache = new Cache<
        string,
        { pools: PrismaPoolAndHookWithDynamic[]; underlyingTokens: { address: string; decimals: number }[] }
    >();
    private readonly SOR_POOLS_CACHE_KEY = `sor:pools`;

    // The new SOR service
    public async getSorSwapPaths(input: GetSwapPathsInput, maxNonBoostedPathDepth = 4): Promise<GqlSorGetSwapPaths> {
        const paths = await this.getSwapPathsFromSor(input, maxNonBoostedPathDepth);
        const emptyResponse = swapPathsZeroResponse(input.tokenIn, input.tokenOut, input.chain);

        if (!paths) {
            return emptyResponse;
        }

        try {
            return this.mapToSorSwapPaths(
                paths!,
                input.swapType,
                input.chain,
                input.protocolVersion as 2 | 3,
                input.queryBatchSwap,
                input.callDataInput,
            );
        } catch (err: any) {
            if (err.message === 'SOR queryBatchSwap failed') {
                throw new Error('SOR queryBatchSwap failed');
            } else {
                console.log(`SOR queryBatchSwap failed`, err);
                Sentry.captureException(err.message, {
                    tags: {
                        service: 'sorV2 query swap',
                        tokenIn: input.tokenIn,
                        tokenOut: input.tokenOut,
                        swapAmount: formatUnits(input.swapAmount.amount, input.swapAmount.token.decimals),
                        swapType: input.swapType,
                        chain: input.chain,
                    },
                });
                return emptyResponse;
            }
        }
    }

    private async getSwapPathsFromSor(
        {
            chain,
            tokenIn,
            tokenOut,
            swapType,
            swapAmount,
            protocolVersion,
            graphTraversalConfig,
            considerPoolsWithHooks,
            poolIds,
        }: GetSwapPathsInput,
        maxNonBoostedPathDepth = 4,
    ): Promise<PathWithAmount[] | null> {
        try {
            const { pools: poolsFromDb, underlyingTokens } = await this.getBasePoolsFromDb(
                chain,
                protocolVersion,
                considerPoolsWithHooks,
                poolIds,
            );
            const tIn = await getToken(tokenIn as Address, chain);
            const tOut = await getToken(tokenOut as Address, chain);
            const swapKind = this.mapSwapTypeToSwapKind(swapType);
            const config = graphTraversalConfig
                ? {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                          ...graphTraversalConfig,
                      },
                  }
                : {
                      graphTraversalConfig: {
                          maxNonBoostedPathDepth,
                      },
                  };
            const paths = await sorGetPathsWithPools(
                tIn,
                tOut,
                swapKind,
                swapAmount.amount,
                poolsFromDb,
                underlyingTokens,
                protocolVersion,
                config,
            );
            // if we dont find a path with depth 4, we try one more level.
            if (!paths && maxNonBoostedPathDepth < 5) {
                // TODO: we should be able to refactor this 'retry' logic so it's configurable from outside instead of hardcoding it here
                return this.getSwapPathsFromSor(arguments[0], maxNonBoostedPathDepth + 1);
            }
            return paths;
        } catch (err: any) {
            console.log(
                `SOR_V2_ERROR ${err.message} - tokenIn: ${tokenIn} - tokenOut: ${tokenOut} - swapAmount: ${swapAmount.amount} - swapType: ${swapType} - chain: ${chain}`,
            );
            Sentry.captureException(err.message, {
                tags: {
                    service: 'sorV2',
                    tokenIn,
                    tokenOut,
                    swapAmount: swapAmount.amount,
                    swapType,
                    chain,
                },
            });
            return null;
        }
    }

    // map the SOR output to the required response type
    private async mapToSorSwapPaths(
        paths: PathWithAmount[],
        swapType: GqlSorSwapType,
        chain: Chain,
        protocolVersion: 2 | 3,
        queryFirst = false,
        callDataInput: (GqlSwapCallDataInput & { wethIsEth: boolean }) | undefined,
    ): Promise<GqlSorGetSwapPaths> {
        const swapKind = this.mapSwapTypeToSwapKind(swapType);

        const sdkSwap = new Swap({
            chainId: parseFloat(chainToIdMap[chain]),
            paths: paths.map((path) => ({
                protocolVersion,
                vaultVersion: protocolVersion,
                inputAmountRaw: path.inputAmount.amount,
                outputAmountRaw: path.outputAmount.amount,
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
            })),
            swapKind,
        });

        let inputAmount = getInputAmount(paths);
        let outputAmount = getOutputAmount(paths);

        let callData: GqlSorCallData | undefined = undefined;

        // TODO: deprecated on-chain query and callData functionality will be supported for v2 for a while, but should be removed in the future
        if (protocolVersion === 2) {
            let queryOutput: ExactInQueryOutput | ExactOutQueryOutput | undefined = undefined;
            let updatedAmount: TokenAmount | undefined = undefined;
            if (queryFirst) {
                try {
                    queryOutput = await sdkSwap.query(config[chain].rpcUrl);
                } catch (error) {
                    throw new Error('SOR queryBatchSwap failed');
                }
                if (swapKind === SwapKind.GivenIn) {
                    updatedAmount = (queryOutput as ExactInQueryOutput).expectedAmountOut;
                } else {
                    updatedAmount = (queryOutput as ExactOutQueryOutput).expectedAmountIn;
                }
            }
            // only total inputAmount or outputAmount is updated
            if (updatedAmount) {
                inputAmount = swapKind === SwapKind.GivenIn ? inputAmount : updatedAmount;
                outputAmount = swapKind === SwapKind.GivenIn ? updatedAmount : outputAmount;
            }

            if (callDataInput) {
                // Slippage.fromPercentage cannot handle more than 6 decimal places because it converts numbers to strings via interpolation, resulting in a scientific notation string.
                if (callDataInput.slippagePercentage.length > 6) {
                    callDataInput.slippagePercentage = callDataInput.slippagePercentage.slice(0, 6);
                }
                if (swapKind === SwapKind.GivenIn) {
                    const callDataExactIn = sdkSwap.buildCall({
                        sender: callDataInput.sender as `0x${string}`,
                        recipient: callDataInput.receiver as `0x${string}`,
                        wethIsEth: callDataInput.wethIsEth,
                        queryOutput: {
                            swapKind,
                            expectedAmountOut: outputAmount,
                            amountIn: inputAmount,
                            to: VAULT[parseInt(chainToIdMap[chain])],
                        } as ExactInQueryOutput,
                        slippage: Slippage.fromPercentage(callDataInput.slippagePercentage as `${number}`),
                        deadline: callDataInput.deadline ? BigInt(callDataInput.deadline) : 999999999999999999n,
                    }) as SwapBuildOutputExactIn;
                    callData = {
                        callData: callDataExactIn.callData,
                        to: callDataExactIn.to,
                        value: callDataExactIn.value.toString(),
                        minAmountOutRaw: callDataExactIn.minAmountOut.amount.toString(),
                    };
                } else {
                    const callDataExactOut = sdkSwap.buildCall({
                        sender: callDataInput.sender as `0x${string}`,
                        recipient: callDataInput.receiver as `0x${string}`,
                        wethIsEth: callDataInput.wethIsEth,
                        queryOutput: {
                            swapKind,
                            expectedAmountIn: inputAmount,
                            amountOut: outputAmount,
                            to: VAULT[parseInt(chainToIdMap[chain])],
                        } as ExactOutQueryOutput,
                        slippage: Slippage.fromPercentage(callDataInput.slippagePercentage as `${number}`),
                        deadline: callDataInput.deadline ? BigInt(callDataInput.deadline) : 999999999999999999n,
                    }) as SwapBuildOutputExactOut;
                    callData = {
                        callData: callDataExactOut.callData,
                        to: callDataExactOut.to,
                        value: callDataExactOut.value.toString(),
                        maxAmountInRaw: callDataExactOut.maxAmountIn.amount.toString(),
                    };
                }
            }
        }

        // TODO: replace price impact ABA with USD values approach (same as used in the FE)
        let priceImpact: string | undefined;
        let priceImpactError: string | undefined;
        try {
            priceImpact = calculatePriceImpact(paths, swapKind).decimal.toFixed(4);
        } catch (error) {
            priceImpact = undefined;
            priceImpactError =
                'Price impact could not be calculated for this path. The swap path is still valid and can be executed.';
        }

        // get all affected pools
        let poolIds: string[] = [];
        for (const path of paths) {
            poolIds.push(...path.pools.map((pool) => pool.id));
        }
        const pools = await poolService.getGqlPools({
            where: { idIn: poolIds },
        });

        const sorPaths: GqlSorPath[] = [];
        for (const path of paths) {
            // paths used as input for b-sdk for client
            sorPaths.push({
                protocolVersion,
                vaultVersion: protocolVersion,
                inputAmountRaw: path.inputAmount.amount.toString(),
                outputAmountRaw: path.outputAmount.amount.toString(),
                tokens: path.tokens.map((token) => ({
                    address: token.address,
                    decimals: token.decimals,
                })),
                pools: path.pools.map((pool) => pool.id),
                isBuffer: path.isBuffer,
            });
        }

        const returnAmount = swapKind === SwapKind.GivenIn ? outputAmount : inputAmount;
        const swapAmount = swapKind === SwapKind.GivenIn ? inputAmount : outputAmount;

        const effectivePrice = outputAmount.amount > 0 ? inputAmount.divDownFixed(outputAmount.scale18) : Infinity;
        const effectivePriceReversed = outputAmount.divDownFixed(inputAmount.scale18);

        return {
            protocolVersion,
            vaultVersion: protocolVersion,
            paths: sorPaths,
            swapType,
            swaps: this.mapSwaps(paths, swapKind),
            tokenAddresses: [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))],
            tokenIn: replaceZeroAddressWithEth(inputAmount.token.address, chain),
            tokenOut: replaceZeroAddressWithEth(outputAmount.token.address, chain),
            tokenInAmount: inputAmount.amount.toString(),
            tokenOutAmount: outputAmount.amount.toString(),
            swapAmount: formatUnits(swapAmount.amount, swapAmount.token.decimals),
            swapAmountRaw: swapAmount.amount.toString(),
            returnAmount: formatUnits(returnAmount.amount, returnAmount.token.decimals),
            returnAmountRaw: returnAmount.amount.toString(),
            effectivePrice:
                effectivePrice === Infinity
                    ? 'Infinity'
                    : formatUnits(
                          (effectivePrice as TokenAmount).amount,
                          (effectivePrice as TokenAmount).token.decimals,
                      ),
            effectivePriceReversed: formatUnits(effectivePriceReversed.amount, effectivePriceReversed.token.decimals),
            routes: this.mapRoutes(paths, pools),
            priceImpact: {
                priceImpact: priceImpact,
                error: priceImpactError,
            },
            callData,
        };
    }

    private mapSwapTypeToSwapKind(swapType: GqlSorSwapType): SwapKind {
        return swapType === 'EXACT_IN' ? SwapKind.GivenIn : SwapKind.GivenOut;
    }

    private mapSwaps(paths: PathWithAmount[], swapKind: SwapKind): GqlSorSwap[] {
        const swaps = this.getSwaps(paths, swapKind);
        const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

        if (Array.isArray(swaps)) {
            return swaps.map((swap) => {
                return {
                    ...swap,
                    assetInIndex: Number(swap.assetInIndex.toString()),
                    assetOutIndex: Number(swap.assetOutIndex.toString()),
                    amount: swap.amount.toString(),
                };
            });
        } else {
            const assetInIndex = assets.indexOf(swaps.assetIn);
            const assetOutIndex = assets.indexOf(swaps.assetOut);
            return [
                {
                    ...swaps,
                    assetInIndex,
                    assetOutIndex,
                    amount: swaps.amount.toString(),
                    userData: swaps.userData,
                },
            ];
        }
    }

    private getSwaps(paths: PathWithAmount[], swapKind: SwapKind) {
        const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;
        const assets = [...new Set(paths.flatMap((p) => p.tokens).map((t) => t.address))];

        let swaps: BatchSwapStep[] | SingleSwap;
        if (isBatchSwap) {
            swaps = [] as BatchSwapStep[];
            if (swapKind === SwapKind.GivenIn) {
                paths.map((p) => {
                    p.pools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(assets.indexOf(p.tokens[i].address)),
                            assetOutIndex: BigInt(assets.indexOf(p.tokens[i + 1].address)),
                            amount: i === 0 ? p.inputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            } else {
                paths.map((p) => {
                    // Vault expects given out swaps to be in reverse order
                    const reversedPools = [...p.pools].reverse();
                    const reversedTokens = [...p.tokens].reverse();
                    reversedPools.map((pool, i) => {
                        (swaps as BatchSwapStep[]).push({
                            poolId: pool.id,
                            assetInIndex: BigInt(assets.indexOf(reversedTokens[i + 1].address)),
                            assetOutIndex: BigInt(assets.indexOf(reversedTokens[i].address)),
                            amount: i === 0 ? p.outputAmount.amount : 0n,
                            userData: DEFAULT_USERDATA,
                        });
                    });
                });
            }
        } else {
            const path = paths[0];
            const pool = path.pools[0];
            swaps = {
                poolId: pool.id,
                kind: swapKind,
                assetIn: path.tokens[0].address,
                assetOut: path.tokens[1].address,
                amount: path.swapAmount.amount,
                userData: DEFAULT_USERDATA,
            } as SingleSwap;
        }
        return swaps;
    }

    /**
     * Fetch pools from Prisma and map to b-sdk BasePool.
     * @returns
     */
    public async getBasePoolsFromDb(
        chain: Chain,
        protocolVersion: number,
        considerPoolsWithHooks: boolean,
        poolIds?: string[],
    ): Promise<{ pools: PrismaPoolAndHookWithDynamic[]; underlyingTokens: { address: string; decimals: number }[] }> {
        const type = {
            in: [
                'WEIGHTED',
                'META_STABLE',
                'PHANTOM_STABLE',
                'COMPOSABLE_STABLE',
                'STABLE',
                'FX',
                'GYRO',
                'GYRO3',
                'GYROE',
            ] as PrismaPoolType[],
        };

        if (poolIds && poolIds.length > 0) {
            const pools = await prisma.prismaPool.findMany({
                where: {
                    id: { in: poolIds },
                    chain,
                    protocolVersion,
                    type,
                },
                include: prismaPoolAndHookWithDynamic.include,
            });
            const underlyingTokens = await this.getUnderlyingTokensFromDBPools(pools, chain);
            return { pools, underlyingTokens };
        }

        const cached = this.cache.get(
            `${this.SOR_POOLS_CACHE_KEY}:${chain}:${protocolVersion}:${considerPoolsWithHooks}`,
        );

        if (cached) {
            return cached;
        }

        const poolIdsToExclude = config[chain].sor?.poolIdsToExclude ?? [];

        const pools = await prisma.prismaPool.findMany({
            where: {
                chain,
                protocolVersion,
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                    swapEnabled: true,
                    totalLiquidity: {
                        gte: chain === 'SEPOLIA' ? 0 : 100,
                    },
                },
                id: {
                    notIn: [...poolIdsToExclude, ...poolsToIgnore],
                },
                type,
            },
            include: prismaPoolAndHookWithDynamic.include,
        });

        const lbps = await prisma.prismaPool.findMany({
            where: {
                chain,
                protocolVersion,
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                    swapEnabled: true,
                },
                id: {
                    notIn: [...poolIdsToExclude, ...poolsToIgnore],
                },
                type: {
                    in: ['LIQUIDITY_BOOTSTRAPPING'],
                },
            },
            include: prismaPoolAndHookWithDynamic.include,
        });

        // always include MEV_CAPTURE hooks, even if considerPoolsWithHooks is false and we dont want to include hooks
        const allPools = [
            ...pools.filter(
                (pool) => considerPoolsWithHooks || !pool.hook || (pool.hook as HookData).type === 'MEV_CAPTURE',
            ),
            ...lbps,
        ];

        const underlyingTokens = await this.getUnderlyingTokensFromDBPools(allPools, chain);
        const result = { pools: allPools, underlyingTokens };

        // cache for 10s
        this.cache.put(
            `${this.SOR_POOLS_CACHE_KEY}:${chain}:${protocolVersion}:${considerPoolsWithHooks}`,
            result,
            10 * 1000,
        );
        return result;
    }

    private async getUnderlyingTokensFromDBPools(
        pools: PrismaPoolAndHookWithDynamic[],
        chain: Chain,
    ): Promise<{ address: string; decimals: number }[]> {
        const tokensWithUnderlying = pools.flatMap((pool) =>
            pool.tokens.filter((token) => token.token.underlyingTokenAddress !== null),
        );

        const erc4626ThatCanBeUsedForSwaps = await prisma.prismaErc4626ReviewData.findMany({
            where: {
                chain,
                erc4626Address: { in: tokensWithUnderlying.map((token) => token.address) },
                canUseBufferForSwaps: true,
            },
        });

        const underlyingTokenAddresses = erc4626ThatCanBeUsedForSwaps.map((data) => data.assetAddress);

        const underlyingTokens = await prisma.prismaToken.findMany({
            where: {
                chain,
                address: {
                    in: underlyingTokenAddresses,
                },
            },
        });

        if (underlyingTokens.length !== underlyingTokenAddresses.length) {
            underlyingTokenAddresses.forEach((address) => {
                if (!underlyingTokens.find((token) => token.address === address)) {
                    console.warn('Underlying token not found for pool', address);
                }
            });
        }
        return underlyingTokens;
    }

    private mapRoutes(paths: PathWithAmount[], pools: GqlPoolMinimal[]): GqlSorSwapRoute[] {
        const isBatchSwap = paths.length > 1 || paths[0].pools.length > 1;

        if (!isBatchSwap) {
            if (pools.length === 0) {
                // this scenario happens when swapping through a single buffer (wrap/unwrap erc4626)
                // TODO: check with the team who's consuming `route` and if it's ok to return an empty array
                // or if we should try to build a GqlSorSwapRoute from the buffer data
                return [];
            }
            const pool = pools.find((p) => p.id === paths[0].pools[0].id);
            if (!pool) throw new Error('Pool not found while mapping route');
            return [this.mapSingleSwap(paths[0], pool)];
        }
        return paths.map((path) => this.mapBatchSwap(path, pools));
    }

    private mapBatchSwap(path: PathWithAmount, pools: GqlPoolMinimal[]): GqlSorSwapRoute {
        const tokenIn = path.tokens[0].address;
        const tokenOut = path.tokens[path.tokens.length - 1].address;
        const tokenInAmount = formatUnits(path.inputAmount.amount, path.tokens[0].decimals);
        const tokenOutAmount = formatUnits(path.outputAmount.amount, path.tokens[path.tokens.length - 1].decimals);

        const hops = [];
        let i = 0;
        for (const pool of path.pools) {
            if (pool.poolType !== 'Buffer') {
                hops.push({
                    tokenIn: `${path.tokens[i].address}`,
                    tokenOut: `${path.tokens[i + 1].address}`,
                    tokenInAmount: i === 0 ? tokenInAmount : '0',
                    tokenOutAmount: i === pools.length - 1 ? tokenOutAmount : '0',
                    poolId: pool.id,
                    pool: pools.find((p) => p.id === pool.id) as GqlPoolMinimal,
                });
            }
            i++;
        }

        return {
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            share: 0.5, // TODO needed?
            hops: hops,
        };
    }

    private mapSingleSwap(path: PathWithAmount, pool: GqlPoolMinimal): GqlSorSwapRoute {
        const tokenIn = path.tokens[0].address;
        const tokenInAmount = formatUnits(path.inputAmount.amount, path.tokens[0].decimals);
        const tokenOut = path.tokens[1].address;
        const tokenOutAmount = formatUnits(path.inputAmount.amount, path.tokens[1].decimals);

        const hop: GqlSorSwapRouteHop = {
            pool,
            poolId: pool.id,
            tokenIn,
            tokenInAmount,
            tokenOut,
            tokenOutAmount,
        };
        return {
            share: 1,
            tokenIn,
            tokenOut,
            tokenInAmount,
            tokenOutAmount,
            hops: [hop],
        } as GqlSorSwapRoute;
    }
}

export const sorV2Service = new SorPathService();
