import { env } from '../apps/env';
import { NetworkData } from '../modules/network/network-config-types';

export default <NetworkData>{
    chain: {
        slug: 'sepolia',
        id: 11155111,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
        prismaId: 'SEPOLIA',
        gqlId: 'SEPOLIA',
    },
    subgraphs: {
        startDate: '2023-05-03',
        cowAmm: 'https://api.studio.thegraph.com/query/75376/balancer-cow-amm-sepolia/version/latest',
        balancer: 'https://api.studio.thegraph.com/query/24660/balancer-sepolia-v2/version/latest',
        balancerV3: 'https://api.studio.thegraph.com/query/75376/balancer-v3-sepolia/version/latest',
        balancerPoolsV3: 'https://api.studio.thegraph.com/query/75376/balancer-pools-v3-sepolia/version/latest',
        blocks: `https://api.studio.thegraph.com/query/48427/bleu-sepolia-blocks/version/latest`,
        gauge: `https://api.studio.thegraph.com/query/24660/balancer-gauges-sepolia/version/latest`,
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'ETH',
        name: 'Ether',
    },
    weth: {
        address: '0x7b79995e5f793a07bc00c21412e50ecae098e7f9',
        addressFormatted: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9',
    },
    coingecko: {
        nativeAssetId: 'ethereum',
        platformId: 'ethereum',
        excludedTokenAddresses: [],
    },
    rpcUrl: env.DRPC_API_KEY
        ? `https://lb.drpc.org/ogrpc?network=sepolia&dkey=${env.DRPC_API_KEY}`
        : 'https://gateway.tenderly.co/public/sepolia',
    rpcMaxBlockRange: 700,
    protocolToken: 'bal',
    bal: {
        address: '0xb19382073c7A0aDdbb56Ac6AF1808Fa49e377B75',
    },
    // veBal: {
    //     address: '0xc128a9954e6c874ea3d62ce62b468ba073093f25',
    //     delegationProxy: '0x81cfae226343b24ba12ec6521db2c79e7aeeb310',
    // },
    balancer: {
        v2: {
            vaultAddress: '0xba12222222228d8ba445958a75a0704d566bf2c8',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.5',
            balancerQueriesAddress: '0xe39b5e3b6d74016b2f6a9673d7d7493b6df549d5',
        },
        v3: {
            vaultAddress: '0xba1333333333a1ba1108e8412f11850a5c319ba9',
            protocolFeeController: '0xa731c23d7c95436baaae9d52782f966e1ed07cc8',
            routerAddress: '0x0bf61f706105ea44694f2e92986bd01c39930280',
            defaultSwapFeePercentage: '0.5',
            defaultYieldFeePercentage: '0.1',
        },
    },
    hooks: {
        lotteryHook: ['0x2d8d157fd6cf773624d97808d77081ee45caa7d4', '0x3c194f14527b4e02b0d09274eca72ccb67613fac'],
        feeTakinghook: ['0xbb1761af481364a6bd7fdbdb8cfa23abd85f0263'],
        exitFeeHook: ['0xea672a54f0aa38fc5f0a1a481467bebfe3c71046'],
        stableSurgeHook: ['0x1adc55adb4caae71abb4c33f606493f4114d2091', '0xc0cbcdd6b823a4f22aa6bbdde44c17e754266aef'],
        veBALFeeDiscountHook: [
            '0xedb47231a12bdf64b8d951ded3351128f95b7e80',
            '0x4b8540ae9f341656dcb7959c2abd8830f3d95738',
        ],
        directionalFeeHook: ['0xd68372e85d8a14afa5fdb3d506bf765939aaf382'],
        nftLiquidityPositionHook: ['0xd06dd26c7209cfe0752725f068299be69a7c9549'],
    },
    multicall: '0x25eef291876194aefad0d60dff89e268b90754bb',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    avgBlockSpeed: 1,
    ybAprConfig: {},
    datastudio: {
        main: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '11anHUEb9snGwvB-errb5HvO8TvoLTRJhkDdD80Gxw1Q',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
        canary: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '1HnJOuRQXGy06tNgqjYMzQNIsaCSCC01Yxe_lZhXBDpY',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
    },
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};
