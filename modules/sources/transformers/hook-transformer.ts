import { GqlHook, GqlHookType, HookParams } from '../../../apps/api/gql/generated-schema';
import { V3JoinedSubgraphPool } from '../subgraphs';
import { zeroAddress } from 'viem';

export type HookData = {
    address: string;
    name?: string;
    type: GqlHookType;
    enableHookAdjustedAmounts: boolean;
    shouldCallAfterSwap: boolean;
    shouldCallBeforeSwap: boolean;
    shouldCallAfterInitialize: boolean;
    shouldCallBeforeInitialize: boolean;
    shouldCallAfterAddLiquidity: boolean;
    shouldCallBeforeAddLiquidity: boolean;
    shouldCallAfterRemoveLiquidity: boolean;
    shouldCallBeforeRemoveLiquidity: boolean;
    shouldCallComputeDynamicSwapFee: boolean;
    dynamicData?: Record<string, string>;
    reviewData?: {
        summary: string;
        reviewFile: string;
        warnings: string[];
    };
};

const typeToParamsType = {
    STABLE_SURGE: 'StableSurgeHookParams',
    FEE_TAKING: 'FeeTakingHookParams',
    EXIT_FEE: 'ExitFeeHookParams',
    DIRECTIONAL_FEE: undefined,
    LOTTERY: undefined,
    VEBAL_DISCOUNT: undefined,
    MEV_CAPTURE: undefined,
    NFTLIQUIDITY_POSITION: undefined,
    UNKNOWN: undefined,
};

export const hookTransformer = (poolData: V3JoinedSubgraphPool): HookData | undefined => {
    // By default v3 pools have a hook config with the address 0x0
    // We don't want to store this in the database because it's not doing anything
    const hookConfig =
        poolData.hookConfig && poolData.hookConfig.hook.address !== zeroAddress ? poolData.hookConfig : undefined;

    if (!hookConfig) {
        return undefined;
    }

    const { hook, ...hookFlags } = hookConfig;

    return {
        address: hook.address.toLowerCase(),
        type: 'UNKNOWN',
        ...hookFlags,
    };
};

export const mapHookToGqlHook = (hookData: HookData): GqlHook | undefined => {
    if (!hookData || !hookData.type) {
        return undefined;
    }

    const paramsTypename = typeToParamsType[hookData.type];

    return {
        address: hookData.address,
        name: hookData.name || '',
        type: hookData.type,
        config: {
            enableHookAdjustedAmounts: hookData.enableHookAdjustedAmounts,
            shouldCallAfterSwap: hookData.shouldCallAfterSwap,
            shouldCallBeforeSwap: hookData.shouldCallBeforeSwap,
            shouldCallAfterInitialize: hookData.shouldCallAfterInitialize,
            shouldCallBeforeInitialize: hookData.shouldCallBeforeInitialize,
            shouldCallAfterAddLiquidity: hookData.shouldCallAfterAddLiquidity,
            shouldCallBeforeAddLiquidity: hookData.shouldCallBeforeAddLiquidity,
            shouldCallAfterRemoveLiquidity: hookData.shouldCallAfterRemoveLiquidity,
            shouldCallBeforeRemoveLiquidity: hookData.shouldCallBeforeRemoveLiquidity,
            shouldCallComputeDynamicSwapFee: hookData.shouldCallComputeDynamicSwapFee,
        },
        reviewData: hookData.reviewData,
        params:
            (paramsTypename &&
                ({
                    __typename: paramsTypename,
                    ...hookData.dynamicData,
                } as HookParams)) ||
            undefined,
        // Deprecated
        enableHookAdjustedAmounts: hookData.enableHookAdjustedAmounts,
        shouldCallAfterSwap: hookData.shouldCallAfterSwap,
        shouldCallBeforeSwap: hookData.shouldCallBeforeSwap,
        shouldCallAfterInitialize: hookData.shouldCallAfterInitialize,
        shouldCallBeforeInitialize: hookData.shouldCallBeforeInitialize,
        shouldCallAfterAddLiquidity: hookData.shouldCallAfterAddLiquidity,
        shouldCallBeforeAddLiquidity: hookData.shouldCallBeforeAddLiquidity,
        shouldCallAfterRemoveLiquidity: hookData.shouldCallAfterRemoveLiquidity,
        shouldCallBeforeRemoveLiquidity: hookData.shouldCallBeforeRemoveLiquidity,
        shouldCallComputeDynamicSwapFee: hookData.shouldCallComputeDynamicSwapFee,
        dynamicData: hookData.dynamicData,
    };
};
