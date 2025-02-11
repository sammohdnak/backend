import { Chain, PrismaTokenTypeOption } from '@prisma/client';
import { prisma } from '../../../../prisma/prisma-client';
import { tokensTransformer } from '../../../sources/transformers/tokens-transformer';
import { V3JoinedSubgraphPool } from '../../../sources/subgraphs';
import { enrichPoolUpsertsUsd } from '../../../sources/enrichers/pool-upserts-usd';
import { type VaultClient } from '../../../sources/contracts';
import { poolUpsertTransformerV3 } from '../../../sources/transformers/pool-upsert-transformer-v3';
import { applyOnchainDataUpdateV3 } from '../../../sources/enrichers/apply-onchain-data';
import { fetchErc4626AndUnderlyingTokenData } from '../../../sources/contracts/fetch-erc4626-token-data';
import { getViemClient } from '../../../sources/viem-client';

/**
 * Gets and syncs all the pools state with the database
 *
 * TODO: simplify the schema by merging the pool and poolDynamicData tables and the poolToken, expandedToken tables
 *
 * @param subgraphPools
 * @param vaultClient
 * @param chain
 * @param blockNumber
 */
export const upsertPools = async (
    subgraphPools: V3JoinedSubgraphPool[],
    vaultClient: VaultClient,
    chain: Chain,
    blockNumber: bigint,
) => {
    // Enrich with onchain data for all the pools
    const onchainData = await vaultClient.fetchPoolData(
        subgraphPools.map((pool) => pool.id),
        blockNumber,
    );

    // Store pool tokens and BPT in the tokens table before creating the pools
    const allTokens = tokensTransformer(subgraphPools, chain);

    const enrichedTokensWithErc4626Data = await fetchErc4626AndUnderlyingTokenData(allTokens, getViemClient(chain));

    // update ERC4626 type data
    for (const token of enrichedTokensWithErc4626Data) {
        await prisma.prismaToken.upsert({
            where: {
                address_chain: {
                    address: token.address,
                    chain: chain,
                },
            },
            create: {
                ...token,
                chain,
            },
            update: {
                ...token,
            },
        });

        if (token.underlyingTokenAddress) {
            await prisma.prismaTokenType.upsert({
                where: {
                    id_chain: {
                        id: `${token.address}-erc4626`,
                        chain,
                    },
                },
                create: {
                    id: `${token.address}-erc4626`,
                    chain,
                    tokenAddress: token.address,
                    type: 'ERC4626',
                },
                update: {
                    id: `${token.address}-erc4626`,
                    chain,
                    tokenAddress: token.address,
                    type: 'ERC4626',
                },
            });
        }
    }

    // There won't be pricing for new tokens
    // Get the prices
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain: chain,
                tokenAddress: { in: allTokens.map((token) => token.address) },
            },
        })
        .then((prices) => Object.fromEntries(prices.map((price) => [price.tokenAddress, price.price])));

    const pools = subgraphPools
        .map((fragment) => poolUpsertTransformerV3(fragment, chain, blockNumber))
        .map((upsert) => {
            const update = applyOnchainDataUpdateV3(
                upsert,
                onchainData[upsert.pool.id],
                upsert.tokens,
                chain,
                upsert.pool.id,
                blockNumber,
            );
            return {
                ...upsert,
                poolToken: update.poolToken,
                poolDynamicData: update.poolDynamicData,
            };
        })
        .map((upsert) => {
            const update = enrichPoolUpsertsUsd(
                {
                    poolDynamicData: upsert.poolDynamicData,
                    poolToken: upsert.poolToken,
                },
                prices,
            );
            return {
                ...upsert,
                poolDynamicData: update.poolDynamicData,
                poolToken: update.poolToken,
            };
        });

    // Upsert pools to the database
    for (const { pool, poolToken, poolDynamicData, poolExpandedTokens } of pools) {
        try {
            await prisma.$transaction([
                prisma.prismaPool.upsert({
                    where: { id_chain: { id: pool.id, chain: pool.chain } },
                    create: pool,
                    update: pool,
                }),

                prisma.prismaPoolDynamicData.upsert({
                    where: { poolId_chain: { poolId: pool.id, chain: pool.chain } },
                    create: poolDynamicData,
                    update: poolDynamicData,
                }),

                // First nullify the pool tokens and then insert them again
                prisma.prismaPoolToken.deleteMany({ where: { poolId: pool.id } }),
                prisma.prismaPoolExpandedTokens.deleteMany({ where: { poolId: pool.id } }),

                prisma.prismaPoolToken.createMany({
                    data: poolToken,
                    skipDuplicates: true,
                }),

                prisma.prismaPoolExpandedTokens.createMany({
                    data: poolExpandedTokens,
                    skipDuplicates: true,
                }),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }

    return pools.map(({ pool }) => pool.id);
};
