import { PrismaPoolDynamicData, PrismaPoolType } from '@prisma/client';
import { isSameAddress } from '@balancer-labs/sdk';
import { networkContext } from '../../network/network-context.service';
import { prisma } from '../../../prisma/prisma-client';

type PoolWithTypeAndFactory = {
    address: string;
    type: PrismaPoolType;
    factory?: string | null;
    dynamicData?: PrismaPoolDynamicData | null;
};

export function isStablePool(poolType: PrismaPoolType) {
    return poolType === 'STABLE' || poolType === 'META_STABLE' || poolType === 'PHANTOM_STABLE';
}

export function isWeightedPoolV2(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'WEIGHTED' &&
        networkContext.data.balancer.weightedPoolV2Factories.find((factory) =>
            isSameAddress(pool.factory || '', factory),
        ) !== undefined
    );
}

export function isComposableStablePool(pool: PoolWithTypeAndFactory) {
    return (
        pool.type === 'PHANTOM_STABLE' &&
        networkContext.data.balancer.composableStablePoolFactories.find((factory) =>
            isSameAddress(pool.factory || '', factory),
        ) !== undefined
    );
}

export function collectsYieldFee(pool: PoolWithTypeAndFactory) {
    return (
        !pool.dynamicData?.isInRecoveryMode &&
        (isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE')
    );
}

export function capturesYield(pool: PoolWithTypeAndFactory) {
    return isWeightedPoolV2(pool) || isComposableStablePool(pool) || pool.type === 'META_STABLE';
}

export async function getProtocolYieldFeePercentage(pool: PoolWithTypeAndFactory): Promise<number> {
    const foundPool = await prisma.prismaPool.findFirstOrThrow({
        where: { chain: networkContext.chain, address: pool.address },
        include: { dynamicData: true },
    });
    if (foundPool.dynamicData?.protocolYieldFee) {
        return parseFloat(foundPool.dynamicData.protocolYieldFee);
    }
    return networkContext.data.balancer.yieldProtocolFeePercentage;
}
