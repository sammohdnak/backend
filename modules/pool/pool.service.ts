import { Chain, PrismaPoolFilter, PrismaPoolStakingType, PrismaPoolSwap } from '@prisma/client';
import _ from 'lodash';
import moment from 'moment-timezone';
import { prisma } from '../../prisma/prisma-client';
import {
    GqlChain,
    GqlPoolAggregator,
    GqlPoolBatchSwap,
    GqlPoolFeaturedPool,
    GqlPoolFeaturedPoolGroup,
    GqlPoolJoinExit,
    GqlPoolMinimal,
    GqlPoolSnapshotDataRange,
    GqlPoolUnion,
    QueryPoolGetBatchSwapsArgs,
    QueryPoolGetJoinExitsArgs,
    QueryPoolGetPoolsArgs,
    QueryPoolGetSwapsArgs,
} from '../../schema';
import { blocksSubgraphService } from '../subgraphs/blocks-subgraph/blocks-subgraph.service';
import { tokenService } from '../token/token.service';
import { userService } from '../user/user.service';
import { PoolAprUpdaterService } from './lib/pool-apr-updater.service';
import { PoolCreatorService } from './lib/pool-creator.service';
import { PoolGqlLoaderService } from './lib/pool-gql-loader.service';
import { PoolOnChainDataService } from './lib/pool-on-chain-data.service';
import { PoolSnapshotService } from './lib/pool-snapshot.service';
import { PoolSwapService } from './lib/pool-swap.service';
import { PoolSyncService } from './lib/pool-sync.service';
import { PoolUsdDataService } from './lib/pool-usd-data.service';
import { networkContext } from '../network/network-context.service';
import { ReliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { ReliquarySnapshotService } from './lib/reliquary-snapshot.service';
import { ContentService } from '../content/content-types';
import { coingeckoDataService } from '../token/lib/coingecko-data.service';
import { syncIncentivizedCategory } from '../actions/pool/sync-incentivized-category';
import {
    deleteGaugeStakingForAllPools,
    deleteMasterchefStakingForAllPools,
    deleteReliquaryStakingForAllPools,
    syncGaugeStakingForPools,
    syncMasterchefStakingForPools,
    syncReliquaryStakingForPools,
} from '../actions/pool/staking';
import { MasterchefSubgraphService } from '../subgraphs/masterchef-subgraph/masterchef.service';
import { AllNetworkConfigsKeyedOnChain } from '../network/network-config';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import { deleteAuraStakingForAllPools, syncAuraStakingForPools } from '../actions/pool/staking/sync-aura-staking';
import { AuraSubgraphService } from '../sources/subgraphs/aura/aura.service';
import { syncVebalStakingForPools } from '../actions/pool/staking/sync-vebal-staking';

export class PoolService {
    constructor(
        private readonly poolCreatorService: PoolCreatorService,
        private readonly poolOnChainDataService: PoolOnChainDataService,
        private readonly poolUsdDataService: PoolUsdDataService,
        private readonly poolGqlLoaderService: PoolGqlLoaderService,
        private readonly poolAprUpdaterService: PoolAprUpdaterService,
        private readonly poolSyncService: PoolSyncService,
        private readonly poolSwapService: PoolSwapService,
        private readonly poolSnapshotService: PoolSnapshotService,
    ) {}

    private get chain() {
        return networkContext.chain;
    }

    private get chainId() {
        return networkContext.chainId;
    }

    private get contentService(): ContentService {
        return networkContext.config.contentService;
    }

    private get balancerSubgraphService() {
        return networkContext.services.balancerSubgraphService;
    }

    public async getGqlPool(id: string, chain: GqlChain, userAddress?: string): Promise<GqlPoolUnion> {
        return this.poolGqlLoaderService.getPool(id, chain, userAddress);
    }

    public async getGqlPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolMinimal[]> {
        return this.poolGqlLoaderService.getPools(args);
    }

    public async getAggregatorPools(args: QueryPoolGetPoolsArgs): Promise<GqlPoolAggregator[]> {
        return this.poolGqlLoaderService.getAggregatorPools(args);
    }

    public async getPoolsCount(args: QueryPoolGetPoolsArgs): Promise<number> {
        return this.poolGqlLoaderService.getPoolsCount(args);
    }

    public async getPoolFilters(): Promise<PrismaPoolFilter[]> {
        return prisma.prismaPoolFilter.findMany({ where: { chain: this.chain } });
    }

    public async getPoolSwaps(args: QueryPoolGetSwapsArgs): Promise<PrismaPoolSwap[]> {
        return this.poolSwapService.getSwaps(args);
    }

    public async getPoolBatchSwaps(args: QueryPoolGetBatchSwapsArgs): Promise<GqlPoolBatchSwap[]> {
        const batchSwaps = await this.poolSwapService.getBatchSwaps(args);

        return batchSwaps.map((batchSwap) => ({
            ...batchSwap,
            swaps: batchSwap.swaps.map((swap) => {
                return {
                    ...swap,
                    pool: this.poolGqlLoaderService.mapToMinimalGqlPool(swap.pool),
                };
            }),
        }));
    }

    public async getPoolJoinExits(args: QueryPoolGetJoinExitsArgs): Promise<GqlPoolJoinExit[]> {
        return this.poolSwapService.getJoinExits(args);
    }

    public async getFeaturedPoolGroups(chains: Chain[]): Promise<GqlPoolFeaturedPoolGroup[]> {
        return this.poolGqlLoaderService.getFeaturedPoolGroups(chains);
    }

    public async getFeaturedPools(chains: Chain[]): Promise<GqlPoolFeaturedPool[]> {
        return this.poolGqlLoaderService.getFeaturedPools(chains);
    }

    public async getSnapshotsForPool(poolId: string, chain: Chain, range: GqlPoolSnapshotDataRange) {
        return this.poolSnapshotService.getSnapshotsForPool(poolId, chain, range);
    }

    public async getSnapshotsForReliquaryFarm(id: number, range: GqlPoolSnapshotDataRange) {
        if (networkContext.data.subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(networkContext.data.subgraphs.reliquary),
            );

            return reliquarySnapshotService.getSnapshotsForFarm(id, range);
        }
        return [];
    }

    public async syncAllPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await networkContext.provider.getBlockNumber();

        return this.poolCreatorService.syncAllPoolsFromSubgraph(blockNumber);
    }

    public async reloadStakingForAllPools(stakingTypes: PrismaPoolStakingType[], chain: Chain): Promise<void> {
        await deleteMasterchefStakingForAllPools(stakingTypes, chain);
        await deleteReliquaryStakingForAllPools(stakingTypes, chain);
        await deleteGaugeStakingForAllPools(stakingTypes, chain);
        await deleteAuraStakingForAllPools(stakingTypes, chain);

        // if we reload staking for reliquary, we also need to reload the snapshots because they are deleted while reloading
        if (stakingTypes.includes('RELIQUARY')) {
            this.loadReliquarySnapshotsForAllFarms();
        }
        // reload it for all pools
        await this.syncStakingForPools([this.chain]);
    }

    public async syncPoolAllTokensRelationship(): Promise<void> {
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: { chain: this.chain },
        });

        for (const pool of pools) {
            await this.poolCreatorService.createAllTokensRelationshipForPool(pool.id);
        }
    }

    public async syncNewPoolsFromSubgraph(): Promise<string[]> {
        const blockNumber = await networkContext.provider.getBlockNumber();

        const poolIds = await this.poolCreatorService.syncNewPoolsFromSubgraph(blockNumber);

        if (poolIds.length > 0) {
            await this.updateOnChainDataForPools(poolIds, blockNumber);
            await this.syncSwapsForLast48Hours();
            await this.updateVolumeAndFeeValuesForPools(poolIds);
        }

        return poolIds;
    }

    public async loadOnChainDataForAllPools(): Promise<void> {
        const result = await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                NOT: {
                    categories: {
                        has: 'BLACK_LISTED',
                    },
                },
                chain: this.chain,
            },
        });
        const poolIds = result.map((item) => item.id);
        const blockNumber = await networkContext.provider.getBlockNumber();

        const chunks = _.chunk(poolIds, 100);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainStatus(chunk);
            await this.poolOnChainDataService.updateOnChainData(chunk, blockNumber);
        }
    }

    public async updateOnChainStatusForPools(poolIds: string[]) {
        const chunks = _.chunk(poolIds, 1000);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainStatus(chunk);
        }
    }

    public async updateOnChainDataForPools(poolIds: string[], blockNumber: number) {
        const chunks = _.chunk(poolIds, 50);

        for (const chunk of chunks) {
            await this.poolOnChainDataService.updateOnChainData(chunk, blockNumber);
        }
    }

    public async loadOnChainDataForPoolsWithActiveUpdates() {
        const blockNumber = await networkContext.provider.getBlockNumber();
        const timestamp = moment().subtract(5, 'minutes').unix();
        const poolIds = await this.balancerSubgraphService.getPoolsWithActiveUpdates(timestamp);

        await this.poolOnChainDataService.updateOnChainData(poolIds, blockNumber);
    }

    public async updateLiquidityValuesForPools(minShares?: number, maxShares?: number): Promise<void> {
        await this.poolUsdDataService.updateLiquidityValuesForPools(minShares, maxShares);
    }

    // It's needed to update the volume and fee for all pools from time to time to "reset" pools that don't have any changes and therefore aren't updated in the syncChangedPools job.
    // We also update the yield capture in the same job, as these are very related metrics and have a similar timing requirement.
    public async updateFeeVolumeYieldForAllPools() {
        await this.updateVolumeAndFeeValuesForPools();
        await this.updateYieldCaptureForAllPools();
    }

    public async updateVolumeAndFeeValuesForPools(poolIds?: string[]): Promise<void> {
        await this.poolUsdDataService.updateVolumeAndFeeValuesForPools(poolIds);
    }

    public async updateYieldCaptureForAllPools() {
        await this.poolUsdDataService.updateYieldCaptureForAllPools();
    }

    public async syncSwapsForLast48Hours(): Promise<string[]> {
        return this.poolSwapService.syncSwapsForLast48Hours();
    }

    public async syncStakingForPools(chains: Chain[]) {
        for (const chain of chains) {
            const networkconfig = AllNetworkConfigsKeyedOnChain[chain];
            if (networkconfig.data.subgraphs.masterchef) {
                await syncMasterchefStakingForPools(
                    chain,
                    new MasterchefSubgraphService(networkconfig.data.subgraphs.masterchef),
                    networkconfig.data.masterchef?.excludedFarmIds || [],
                    networkconfig.data.fbeets?.address || '',
                    networkconfig.data.fbeets?.farmId || '',
                    networkconfig.data.fbeets?.poolId || '',
                );
            }
            if (networkconfig.data.subgraphs.reliquary) {
                await syncReliquaryStakingForPools(
                    chain,
                    new ReliquarySubgraphService(networkconfig.data.subgraphs.reliquary),
                    networkconfig.data.reliquary?.address || '',
                    networkconfig.data.reliquary?.excludedFarmIds || [],
                );
            }
            if (networkconfig.data.subgraphs.gauge && networkContext.data.bal?.address) {
                await syncGaugeStakingForPools(
                    new GaugeSubgraphService(networkconfig.data.subgraphs.gauge),
                    networkContext.data.bal.address,
                );
            }
            if (networkconfig.data.subgraphs.aura) {
                await syncAuraStakingForPools(chain, new AuraSubgraphService(networkconfig.data.subgraphs.aura));
            }

            if (chain === 'MAINNET') {
                await syncVebalStakingForPools();
            }
        }
    }

    public async updatePoolAprs(chain: Chain) {
        await this.poolAprUpdaterService.updatePoolAprs(chain);
        await syncIncentivizedCategory();
    }

    public async syncChangedPools() {
        await this.poolSyncService.syncChangedPools();
    }

    public async reloadAllPoolAprs(chain: Chain) {
        await this.poolAprUpdaterService.reloadAllPoolAprs(chain);
        await syncIncentivizedCategory();
    }

    public async updateLiquidity24hAgoForAllPools() {
        await this.poolUsdDataService.updateLiquidity24hAgoForAllPools();
    }

    public async loadSnapshotsForPools(poolIds: string[], reload: boolean) {
        if (reload) {
            await prisma.prismaPoolSnapshot.deleteMany({
                where: { chain: this.chain, poolId: { in: poolIds } },
            });
        }

        await this.poolSnapshotService.loadAllSnapshotsForPools(poolIds);
    }

    public async loadSnapshotsForAllPools() {
        await prisma.prismaPoolSnapshot.deleteMany({ where: { chain: this.chain } });
        const pools = await prisma.prismaPool.findMany({
            select: { id: true },
            where: {
                dynamicData: {
                    totalSharesNum: {
                        gt: 0.000000000001,
                    },
                },
                chain: this.chain,
            },
        });
        const chunks = _.chunk(pools, 10);

        for (const chunk of chunks) {
            const poolIds = chunk.map((pool) => pool.id);
            await this.poolSnapshotService.loadAllSnapshotsForPools(poolIds);
        }
    }

    public async syncLatestReliquarySnapshotsForAllFarms() {
        if (networkContext.data.subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(networkContext.data.subgraphs.reliquary),
            );
            await reliquarySnapshotService.syncLatestSnapshotsForAllFarms();
        }
    }

    public async loadReliquarySnapshotsForAllFarms() {
        if (networkContext.data.subgraphs.reliquary) {
            const reliquarySnapshotService = new ReliquarySnapshotService(
                new ReliquarySubgraphService(networkContext.data.subgraphs.reliquary),
            );
            await prisma.prismaReliquaryTokenBalanceSnapshot.deleteMany({ where: { chain: this.chain } });
            await prisma.prismaReliquaryLevelSnapshot.deleteMany({ where: { chain: this.chain } });
            await prisma.prismaReliquaryFarmSnapshot.deleteMany({ where: { chain: this.chain } });
            const farms = await prisma.prismaPoolStakingReliquaryFarm.findMany({ where: { chain: this.chain } });
            const farmIds = farms.map((farm) => parseFloat(farm.id));
            for (const farmId of farmIds) {
                await reliquarySnapshotService.loadAllSnapshotsForFarm(farmId);
            }
        }
    }

    public async updateLifetimeValuesForAllPools() {
        await this.poolUsdDataService.updateLifetimeValuesForAllPools();
    }

    public async initOnChainDataForAllPools() {
        await this.poolSyncService.initOnChainDataForAllPools();
    }

    public async createPoolSnapshotsForPoolsMissingSubgraphData(poolId: string) {
        await this.poolSnapshotService.createPoolSnapshotsForPoolsMissingSubgraphData(poolId);
    }

    public async reloadAllTokenNestedPoolIds() {
        await this.poolCreatorService.reloadAllTokenNestedPoolIds();
    }

    public async deletePool(poolId: string) {
        const pool = await prisma.prismaPool.findUniqueOrThrow({
            where: { id_chain: { id: poolId, chain: this.chain } },
        });

        const poolTokens = await prisma.prismaPoolToken.findMany({
            where: { chain: this.chain, poolId: poolId },
        });

        const poolTokenAddresses = poolTokens.map((poolToken) => poolToken.address);

        await prisma.prismaTokenType.deleteMany({
            where: { chain: this.chain, tokenAddress: pool.address },
        });

        await prisma.prismaUserWalletBalance.deleteMany({
            where: { chain: this.chain, poolId: poolId },
        });

        await prisma.prismaTokenDynamicData.deleteMany({
            where: { chain: this.chain, tokenAddress: { in: poolTokenAddresses } },
        });

        const poolStaking = await prisma.prismaPoolStaking.findMany({
            where: { chain: this.chain, poolId: poolId },
        });

        for (const staking of poolStaking) {
            switch (staking.type) {
                case 'GAUGE':
                    await prisma.prismaPoolStakingGaugeReward.deleteMany({
                        where: { chain: this.chain, gaugeId: staking.id },
                    });

                    // delete votingGauge entry before deleting the staking gauge
                    let gauge = await prisma.prismaPoolStakingGauge.findFirst({
                        where: {
                            chain: this.chain,
                            stakingId: staking.id,
                        },
                        select: {
                            votingGauge: true,
                        },
                    });

                    if (gauge && gauge.votingGauge)
                        await prisma.prismaVotingGauge.deleteMany({
                            where: { chain: this.chain, id: { in: gauge.votingGauge.map((gauge) => gauge.id) } },
                        });

                    await prisma.prismaPoolStakingGauge.deleteMany({
                        where: { chain: this.chain, stakingId: staking.id },
                    });
                    break;

                case 'MASTER_CHEF':
                    await prisma.prismaPoolStakingMasterChefFarmRewarder.deleteMany({
                        where: { chain: this.chain, farmId: staking.id },
                    });

                    await prisma.prismaPoolStakingMasterChefFarm.deleteMany({
                        where: { chain: this.chain, stakingId: staking.id },
                    });
                    break;
                case 'RELIQUARY':
                    await prisma.prismaPoolStakingReliquaryFarmLevel.deleteMany({
                        where: { chain: this.chain, farmId: staking.id.split('-')[1] },
                    });

                    await prisma.prismaPoolStakingReliquaryFarm.deleteMany({
                        where: { chain: this.chain, stakingId: staking.id },
                    });
                    break;
                default:
                    break;
            }
        }

        await prisma.prismaUserStakedBalance.deleteMany({
            where: { chain: this.chain, poolId: poolId },
        });

        await prisma.prismaPoolStaking.deleteMany({
            where: { chain: this.chain, poolId: poolId },
        });

        await prisma.prismaPool.delete({
            where: { id_chain: { id: poolId, chain: this.chain } },
        });
    }

    public async syncChangedPoolsV3() {
        throw new Error('Method not implemented.');
    }

    public async loadOnChainDataForPoolsWithActiveUpdatesV3() {
        throw new Error('Method not implemented.');
    }

    public async syncNewPoolsFromSubgraphV3() {
        throw new Error('Method not implemented.');
    }

    public async updateLiquidity24hAgoForAllPoolsV3() {
        throw new Error('Method not implemented.');
    }

    public async syncLatestSnapshotsForAllPoolsV3() {
        throw new Error('Method not implemented.');
    }

    public async updateLifetimeValuesForAllPoolsV3() {
        throw new Error('Method not implemented.');
    }
}

export const poolService = new PoolService(
    new PoolCreatorService(userService),
    new PoolOnChainDataService(tokenService),
    new PoolUsdDataService(tokenService, blocksSubgraphService),
    new PoolGqlLoaderService(),
    new PoolAprUpdaterService(),
    new PoolSyncService(),
    new PoolSwapService(tokenService),
    new PoolSnapshotService(coingeckoDataService),
);
