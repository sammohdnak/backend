# backend

## 1.32.2

### Patch Changes

-   f0391f1: production stableSurge amp
-   67cbe5a: SOR - Update stable surge hook support
-   72f0db1: StableSurge production addresses

## 1.32.1

### Patch Changes

-   a32c701: hotfix for unsupported hooks in the schema
-   672adf9: fix underlying token upsert
-   9eb01c7: new aggregator query, add hook type
-   d7d0be8: SG deployments for stable surge

## 1.32.0

### Minor Changes

-   b19f649: remove old SOR query
-   0771d8d: morpho rewards

### Patch Changes

-   6ebbbd0: add avalon apr
-   6843d0e: removing block SG urls from config
-   42bb0e9: new wrapper for usdcn on arb

## 1.31.4

### Patch Changes

-   adc2d53: add beetswars mabeets apr
-   a222383: hook type specific return types
-   257eac0: fix small pricing issues with 4626
-   40861c6: backward compatibility for hooks on FE
-   09ec9d2: adding gyro pools to SG

## 1.31.3

### Patch Changes

-   1adfe6a: fix missing underlying error handling
-   b9386ee: new stable surge hook on sepolia
-   7bd85d9: ignore common issue when underlying is not priced
-   4acac18: yUSD APR

## 1.31.2

### Patch Changes

-   84247db: sUSDs - base

## 1.31.1

### Patch Changes

-   0f5c061: aave pyUSD APR

## 1.31.0

### Minor Changes

-   e047a6c: replacing blocks subgraph with data from events

### Patch Changes

-   a29f079: hgETH APR

## 1.30.0

### Minor Changes

-   05bbbc0: historical price range ALL

### Patch Changes

-   5377366: prisma sentry setup
-   f6de49e: complete v3 config arb/base

## 1.29.3

### Patch Changes

-   3f534d2: add silo apr handler
-   338311f: SOR - Fix LBPs not being picked up

## 1.29.2

### Patch Changes

-   ed867e5: add generalized erc4626 price handler
-   9d1a4b3: v3 on base and arbitrum

## 1.29.1

### Patch Changes

-   1848cec: add beefy apr handler
-   0c7924b: rekt token pricing to 0
-   e1c0170: expose exempt from yield fee
-   43b8dea: SOR - Fix buffer unwrapRate scaling

## 1.29.0

### Minor Changes

-   628235a: apollo v4

### Patch Changes

-   0052e91: add graphql-tag
-   45f5127: temp disable savax
-   36939bb: disable apollo default explorer on prod
-   a5223df: add v3 jobs to sonic
-   5bd786e: more hook addresses
-   9e90ebe: remove beetswars apr from fantom
-   b3b0f10: SOR - Assert behavior for tokens with 0 decimals
-   18abe26: sepolia hooks config
-   1455479: remove dependency to AllNetworkConfigsKeyedOnChain
-   896cca6: SOR - Add StablePool for Balancer v2

## 1.28.2

### Patch Changes

-   3b3ba2c: fix liquidity 24hrs ago, fix price for data studio for beets

## 1.28.1

### Patch Changes

-   a4f25c3: fix isLiquidityManagement in SOR

## 1.28.0

### Minor Changes

-   331cf71: This pr adds hooks to the SOR (DirectionalFee, StableSurge, ExitFee)

### Patch Changes

-   7126cf3: bpt balances syncing refactor
-   7481c31: can add points to tokens

## 1.27.9

### Patch Changes

-   304bea4: reference config some data-only files
-   6f949b9: fix env config for sentry
-   faa2e26: respect max block range for changed pools

## 1.27.8

### Patch Changes

-   31efe9e: remove totalFee and totalVolume from protocol metrics
-   946041a: use freshbeets pool on sonic to price beets
-   231e527: set totals to 0 instead

## 1.27.7

### Patch Changes

-   58d3e25: SOR - Fix split paths to support larger swaps

## 1.27.6

### Patch Changes

-   612e23e: sor slippage handling patch

## 1.27.5

### Patch Changes

-   9d902e6: updating gauge SG urls including v3 pools
-   9d902e6: teth apr on arbitrum

## 1.27.4

### Patch Changes

-   4b25f8e: possible fix for staked balance formatting on write
-   1aac890: fix to a fix
-   09ec5a3: patch user balances formatting
-   a1dd2c4: prisma v6
-   d41c603: setup prisma sentry integration
-   4e63397: fix sor slippage formatting
-   341abcf: updating gauge SG urls including v3 pools
-   160c10c: removing prisma sentry integration due to lack of support
-   4715a49: prisma telemetry setup

## 1.27.3

### Patch Changes

-   f6610d0: manage sentry config via env
-   b27003d: handle additional morpho token reward apr
-   f416bf9: adjust sentry sample rates

## 1.27.2

### Patch Changes

-   5c1567e: new morpho aprs
-   e73df95: revert subgraph fallbacks
-   ec1174b: add alerts for subgraph lags

## 1.27.1

### Patch Changes

-   931c829: collect subgraph lag metrics
-   7d0f05c: publish mode subgraphs to network
-   7f20e8e: handle missing tokens in erc4626 rates
-   e2453c8: use beets drpc key
-   b0f0279: fix: handle empty erc4626Tokens array

## 1.27.0

### Minor Changes

-   2b15183: Update SOR buffers to use unwrapRate from erc4626 tokens

### Patch Changes

-   82b7e0d: swap needs to be at least $1 to be used as pricing
-   2e9f4cd: Revert PrismaPoolSnapshot index changes

## 1.26.29

### Patch Changes

-   2b41540: need to consider gauge cap for mainnet gauges
-   a437b87: add sonic beets circulating supply endpoint
-   4b18c78: dont display phantom BPT as nested pool in pool tokens

## 1.26.28

### Patch Changes

-   7cc43be: add AaveUSDe LidoGHO APRs
-   44411b3: new aprs

## 1.26.27

### Patch Changes

-   7a0ae59: adding dynamic swap fee to fx pools
-   a16406b: balance tables indexes
-   5011ef2: optimise multichain events query
-   580c5e7: db indexes

## 1.26.26

### Patch Changes

-   4cfa9f8: debug erroring job
-   c5f527d: fix: erroring job
-   4006bb0: add index to snapshots

## 1.26.25

### Patch Changes

-   615943c: fixed usdx apr
-   8270969: refactor of sync-tokens-from-pool-tokens job

## 1.26.24

### Patch Changes

-   380173f: fetch staking apr from api

## 1.26.23

### Patch Changes

-   033f8f6: add sonic staking snapshots

## 1.26.22

### Patch Changes

-   e1087c7: susdx apr

## 1.26.21

### Patch Changes

-   a0bcaf7: add sts tvl to protocol stats

## 1.26.20

### Patch Changes

-   f125013: removing few more unused deps
-   61b9c66: add sonic staking data and apr

## 1.26.19

### Patch Changes

-   4b118b5: use bun as package manager
-   31da359: cow amm base config
-   7f3e36c: partially removing network context

## 1.26.18

### Patch Changes

-   cf338a6: dependencies cleanup
-   8b462a2: Prevent disallowed buffers on SOR paths

## 1.26.17

### Patch Changes

-   35ee2fe: add isBufferAllowed to pooltoken
-   4a9fe0c: always pass multicall3 address in viem

## 1.26.16

### Patch Changes

-   bc501c8: add staking to sonic
-   863a840: Fix SOR routes when swapping through a single buffer only
-   cacabb2: add isAllowedBuffer flag
-   910eedc: add sonic chain

## 1.26.15

### Patch Changes

-   4c6418b: fix: handle SG values as floats in cow amm snapshots
-   6347252: refactor cow-amm snapshot fetching
-   913c906: refactor snapshot daily and total values

## 1.26.14

### Patch Changes

-   6872789: fix: ERC4626 tagging

## 1.26.13

### Patch Changes

-   958fd86: fix: changed pools syncing

## 1.26.12

### Patch Changes

-   b96a671: fix: swap fee token

## 1.26.11

### Patch Changes

-   e2c788f: fix: handle swap fees in V3 snapshots

## 1.26.10

### Patch Changes

-   f02c667: fixed V3 snapshot fees

## 1.26.9

### Patch Changes

-   dbbe6a9: refactored v3 snapshots syncing

## 1.26.8

### Patch Changes

-   0b6d99e: remove rpc dependency on pool upserts
-   4a6e3c7: replace USDL APR source

## 1.26.7

### Patch Changes

-   26e0aca: fix balance scaling

## 1.26.6

### Patch Changes

-   0887858: fix onchain balances for v3

## 1.26.5

### Patch Changes

-   e81774e: fix syncing v3 changed pools
-   8768e95: handle custom morpho rewards

## 1.26.4

### Patch Changes

-   63a4492: waGnowstETH APR and price

## 1.26.3

### Patch Changes

-   cdf0cb6: aave pricing
-   d497a71: fix: handle checksum addresses in tags assignment
-   1a0f088: Morpho APRs and pricing
-   75cb205: handle all aave prices from aprs config

## 1.26.2

### Patch Changes

-   7f6df7f: boosted tag only on v3

## 1.26.1

### Patch Changes

-   caa0e6c: updated usdL apr source
-   ddd87af: protocol stats alignment with pools list
-   c5e9911: more aave prices, but still missing rates for new tokens

## 1.26.0

### Minor Changes

-   c507c33: V3 mainnet and gnosis

### Patch Changes

-   d7706da: expose additional fields in the poolTokenDetails schema
-   0c9901a: sepolia v12
-   6d4c98e: Update SDK and Balancer Maths dependencies

## 1.25.0

### Minor Changes

-   7a93ab8: removing poolTokenDynamicData dependency

### Patch Changes

-   3f22a3d: apply v3 protocol swap fees

## 1.24.0

### Minor Changes

-   751e1e8: new aave aprs and default yield fee

### Patch Changes

-   40937e2: move op blocks to builders dao

## 1.23.10

### Patch Changes

-   fe549d3: updating holderCount stat for v3 pools
-   2046d6f: change 7 and 30 days swap apr to use snapshots
-   c92ac36: filter out balances for missing pools

## 1.23.9

### Patch Changes

-   77ceae7: dont remove user balances unless 0

## 1.23.8

### Patch Changes

-   8f09f97: no casesensitive compare for hook metadata
-   28f4778: V3 deployment 11
-   16aebc3: Adding V3 pool roles to the db model
-   f17f276: fix wallet balance ID to follow subgraph use of poolAddress instead of poolId
-   a44f00f: Deprecate callData related inputs and outputs from SOR
-   2fca2d8: fix tokens query resultset to include missing rate provider data
-   4b5454a: fix V3 BPT balance syncing
-   094b17f: fix adding missing role accounts to pools
-   e2f315b: skip token name in the pool textSearch

## 1.23.7

### Patch Changes

-   1bd6dfa: base api key gauges subgraph url
-   848b8a3: API key URLs for block subgraphs

## 1.23.6

### Patch Changes

-   b6c978e: Adding Base aprs for wstETH, rETH, weETH.

## 1.23.5

### Patch Changes

-   35e8c33: vETH APR source update

## 1.23.4

### Patch Changes

-   02e139a: adding poolIds filter to SOR
-   dcc6440: APR sources, remove sAPE, svETH, swETH, USDR; add sdeUSD
-   21b40a4: Redo how hooks are synced and change the schema

## 1.23.3

### Patch Changes

-   f7ee6e5: Feat add pool with hook consider flag
-   6551463: remove overnight apr
-   c9e8d42: using total supply instead of working supply for gauge tvl, as per zen dragon
-   6e4feff: adapt gauge apr again as per zen dragon

## 1.23.2

### Patch Changes

-   3d6a3de: add poolTokens to minimal pool
-   67a718c: SOR - Add support to Dola/USDC stable swap
-   f5911fd: adding hook info to nested pools
-   6b140a4: add ERC4626 and rateprovider data into poolTokens of MinimalPool

## 1.23.1

### Patch Changes

-   7f0ee69: adapt nested balance and usd of a token to its share
-   6d14f60: enable LBP in sor and sync

## 1.23.0

### Minor Changes

-   23f6773: Add hook and erc4626 reviews and tags. Adapt to new metadata repo layout.

### Patch Changes

-   3c0909d: use new priceimpact calc for Beets SOR path
-   5cabb48: sync bptPriceRate for v3 pools
-   33ffa59: reduce vebal balance multicall batchsize
-   daa73e2: fix review data exposure
-   4337d11: return all token prices
-   1b3ef2d: fix sor hops with buffers
-   232ee9e: add tokenIn filter for tokens query

## 1.22.0

### Minor Changes

-   0b445a9: Treehouse tETH APR handler

### Patch Changes

-   5b4b001: add erc4626 flags to base pool
-   02e7ca8: adding hasNestedErc4626 flag
-   64daeb6: filter buffers from hops in sor response
-   a197c10: remove old sor lambda and add workaround for multiple paths
-   cbbb4df: add hook data to basepool

## 1.21.16

### Patch Changes

-   1f4fbc1: fix: missing hooks data
-   35886a7: fix relic sync

## 1.21.15

### Patch Changes

-   401987d: fix: add missing totalSharesNum column for COW_AMM pools

## 1.21.14

### Patch Changes

-   0098dbf: fix: pool total aprs should exclude 7d,30d
-   d3cf1e0: fix long term apr for legacy items

## 1.21.13

### Patch Changes

-   0b56465: fix cow amm SG pool fetching

## 1.21.12

### Patch Changes

-   27bb15a: fix: add an update to "totalSharesNum" column
-   d021220: change reth apr source
-   ade5959: adding surplus and swap APR based on 7d and 30d values
-   9794d8d: refactor pool transformers, add scaling factors
-   d71162a: fix: sync cow amm balances on adding new pools
-   6bc68c9: adding balance fetching margin
-   92cb5a4: update cow amm subgraphs
-   af45007: add new fantom subgraph version
-   6bf00c8: fix erc4626 data fetching
-   4190058: fix: adding missing bpt token records
-   6f18aab: update sepolia blocks subgraph and vault v3 abis
-   a4f6220: use 10th deployment of v3
-   303f3e0: fix: overwriting of subgraph data
-   2afa4ba: changing sepolia blocks SG
-   51aeb1c: expose bias and slope in vebal user snapshots

## 1.21.11

### Patch Changes

-   6d70678: sync vebal user snapshots
-   5249d64: fix SOR raw amounts

## 1.21.10

### Patch Changes

-   025c43d: limit db data over-reading for batch swaps query (beets)

## 1.21.9

### Patch Changes

-   0cf158a: remove yearn apr from fantom

## 1.21.8

### Patch Changes

-   7df8cc6: fixing user sync balance for reliquary positions
-   4a46b01: allow searching by pool ID
-   1962da6: add enrichments to aggregator query
-   eabb550: dvstETH-APR-mainnet
-   a529b35: track last synced block for v3
-   a5b85ad: 9th v3 deployment

## 1.21.7

### Patch Changes

-   a159cc9: fix hardcoded protocolVersion return value in SOR paths
-   127142c: fix protocol metrics

## 1.21.6

### Patch Changes

-   4bd3844: rename polygon native asset from MATIC to POL
-   33bac59: Add stataAvaWAVAX2 APR hanlder
-   9d8e6de: add scalingfactor, liquidity mangement and default filters to aggregator query
-   716e7f0: move swap service to actions
-   92adb18: fix paused state parsing issue
-   f613949: change hook filter to bool
-   ebc0eaf: feat: allow stable pool routing for v3
-   a7ed429: adding wUSDL apr on arbitrum

## 1.21.5

### Patch Changes

-   fd5ea37: multicall request size tuning
-   c0fc647: fix balance calculation

## 1.21.4

### Patch Changes

-   90bc31a: fix pool token price query

## 1.21.3

### Patch Changes

-   e33ff3a: populate prismaPoolSwap table until everything is migrated

## 1.21.2

### Patch Changes

-   8532816: update cow subgraph on other chains

## 1.21.1

### Patch Changes

-   3c6840e: make v2 sync work with nested pool creation in the same block
-   a6e8e1a: update cow subgraph for mainnet

## 1.21.0

### Minor Changes

-   19abfd7: adding liquidity management json
-   56b06a5: adding pool actions for v2

### Patch Changes

-   8aacde1: use cow_amm type selector for syncing actions
-   e96b9be: use bigint in tokenpair sync
-   056c32d: fix weth address for sepolia
-   462b6d9: add liquidity mangement to pool list query
-   39f2e4a: enable v2 syncs for sepolia

## 1.20.10

### Patch Changes

-   53d8445: sync all token metadata from tokenlist

## 1.20.9

### Patch Changes

-   44ca026: gyro config on avax

## 1.20.8

### Patch Changes

-   64e55d4: add defillama yields as an APR adapter
-   07e1f17: Fix Gyro2CLPPool implementations to account for token rates during swaps.

## 1.20.7

### Patch Changes

-   5419dc5: avax subgraph deployment update
-   bcd8189: Handle parsing errors causing the app to crash

## 1.20.6

### Patch Changes

-   0cb9214: adding Aave lUSD and crvUSD APRs
-   1c9aa5b: use default rpc url for fetching svEth APR data
-   a0d5b42: use subgraph deployment if for zkevm
-   dd3e100: Enable sdBal stable pool.

## 1.20.5

### Patch Changes

-   0ab785d: fetch token rates for gyro2 pools

## 1.20.4

### Patch Changes

-   14b6f71: adding aura balance tracking to fraxtal
-   3fb6c32: change RPCs to dRPC

## 1.20.3

### Patch Changes

-   6c67ceb: SOR shouldn't be using all static pools
-   c64e675: handle queryBatchSwap errors
-   6c67ceb: add sync latest fx prices as a task

## 1.20.2

### Patch Changes

-   2a486d0: fixing prisma include issue in updateAllTokenPrices

## 1.20.1

### Patch Changes

-   c8913ca: Enable Stable pools for non-V3 in SOR.

## 1.20.0

### Minor Changes

-   9d9b90d: Subgraph client will fallback to another URL on failure

### Patch Changes

-   d813678: dev setup with hot reloading
-   5ea8f51: adding prodction base subgraph url
-   7f76312: AAVE APRs on gnosis and wUSDM on OP

## 1.19.0

### Minor Changes

-   db7314d: add hook type name, handle swap amount = 0 errors
-   46704ef: updating V3 vault deployment to v8 on sepolia

## 1.18.0

### Minor Changes

-   a6b5027: update protocol revenue APR to usdc

### Patch Changes

-   dac4636: prevent common issues from being sent to sentry
-   1516a1b: handle SOR's effective price when outputAmount is 0

## 1.17.0

### Minor Changes

-   8257bdd: organising apps and updating sentry
-   37d9161: cow amm on arbitrum

### Patch Changes

-   f0f4deb: make return values in GqlSorPath required
-   6baafda: Report missing tokens for active rewards only

## 1.16.0

### Minor Changes

-   04a202e: adding reward token data to apr item

### Patch Changes

-   4b3aa1e: add reward token to yb and nested apr
-   d61718a: adding new pool query specific for aggregator needs
-   420ff5f: refactoring VotingGaugesRepository to use viem

## 1.15.0

### Minor Changes

-   7f6a2bf: adding maker and renzo APRs on Mode

## 1.14.8

### Patch Changes

-   ac4ff07: make queries to use wallet indexes properly

## 1.14.7

### Patch Changes

-   039f01b: use index when querying events by userAddress

## 1.14.6

### Patch Changes

-   271c9ae: optimise main events query index

## 1.14.5

### Patch Changes

-   07d60a7: cleaup event indexes

## 1.14.4

### Patch Changes

-   cc9899d: skip sftmx vaults that are 0x0

## 1.14.3

### Patch Changes

-   bf14fb9: associate gauge balances on pool addresses

## 1.14.2

### Patch Changes

-   0e599cb: adding event query logging to triage db issues

## 1.14.1

### Patch Changes

-   5b8e7d5: fix cow amm event syncing

## 1.14.0

### Minor Changes

-   1545310: SOR - Add support for paths with buffers/boosted pools

### Patch Changes

-   62baccf: make sure cow amm balances are added for new pools
-   03f81ff: add aFRAX APR
-   d9ebb9a: handle streamed BAL on mainnet properly
-   d87f76e: Dont show MERKL APR if it has a whitelist

## 1.13.0

### Minor Changes

-   ce47937: adding cow amm SG balance syncing

## 1.12.0

### Minor Changes

-   2141ceb: APR source for yieldnest ETH (ynETH)

### Patch Changes

-   93e44ae: add agETH APR for mainnet
-   b381a08: committing generate graphql schemas

## 1.11.1

### Patch Changes

-   b0eef3d: flatten the event type in the events query

## 1.11.0

### Minor Changes

-   570a67b: adding a query for getting multichain vebal balances

### Patch Changes

-   9f7d395: add merkl, voting and locking as incentivized pool
-   e0fa5d8: Prune records with zero values in balance tables
-   ddf8be9: filtering events by value in USD
-   ed9747b: adding relative weigth to the voting list query

## 1.10.0

### Minor Changes

-   ad09bfd: susx and usdm APRs on Arb
-   5a023cb: adding support for hooks
-   aae66a9: cdcETH APR

### Patch Changes

-   5ec208f: Fix scientific notation issue caused by parseFloat
-   8a7c851: Adding aggregate fee fields to pools dynamic data
-   01a1b1a: accept any letter casing in queries
-   6782183: SOR - Replace parseFloat with parseEther

## 1.9.3

### Patch Changes

-   cd94cd1: Using API prices to calculate totalLiquidity in snapshots
-   31d93a1: passing protocol version to sor lib

## 1.9.2

### Patch Changes

-   aff6246: update env file

## 1.9.1

### Patch Changes

-   a3ab47e: workaround for streamed BAL on mainnet

## 1.9.0

### Minor Changes

-   ad5c843: Add support for SOR paths with add/remove liquidity steps

### Patch Changes

-   ff80266: adding mutation to reload erc4626
-   0cb2dbb: quick workaround to remove cow apr boost

## 1.8.3

### Patch Changes

-   29f0beb: using pool addresses to match gauges instead of pool id

## 1.8.2

### Patch Changes

-   55fa750: SOR should consider STABLE pools for v3 liquidity only

## 1.8.1

### Patch Changes

-   7d327cf: fix token query

## 1.8.0

### Minor Changes

-   7720c09: add support for boosted pools for v3

### Patch Changes

-   116cf21: expose surplus in the events query
-   421a48e: Refactor SOR to use Balancer Maths for v3 liquidity

## 1.7.4

### Patch Changes

-   1d3f265: v2 update interferes with cow

## 1.7.3

### Patch Changes

-   af11d6b: fix cow-surplus scaling, update cow volume sync

## 1.7.2

### Patch Changes

-   13f2416: update cow amm subgraphs
-   956f28c: update masterchef subgraph

## 1.7.1

### Patch Changes

-   e102809: stakewise gnosis and maple syrup APRs

## 1.7.0

### Minor Changes

-   0847dd4: syncing pool type specific data

### Patch Changes

-   af4417e: updated AAVE subgraph URLs for getting token APRs
-   b08fa1e: update cow subgraphs
-   b20c5fd: sync tokenlist for sepolia

## 1.6.3

### Patch Changes

-   72cc583: add weETH APR on Arb and rETH APR on Gnosis

## 1.6.2

### Patch Changes

-   07fcf6a: fixed surplus APR calculation
-   a72b08f: move rpcs from infura to alchemy

## 1.6.1

### Patch Changes

-   0627776: fixed sdai yield on fraxtal

## 1.6.0

### Minor Changes

-   f9d50e4: syncing holders could on changed cow-amm pools

### Patch Changes

-   5f6fd67: handle failing aave pricing

## 1.5.5

### Patch Changes

-   3f08512: subgraph patch

## 1.5.4

### Patch Changes

-   5c02fa1: new cow-subgraphs, add weights to cow-pools, add reload mutation
-   0959978: fix snapshot loading for cow
-   ede18b9: fixed double execution of the merkl job
-   6a8d02e: add aave wrapped tokens to sepolia handler
-   fec4cac: Fix cow user balances
-   975e058: fix token rate and config sync for v3, add reload mutation

## 1.5.3

### Patch Changes

-   22bc735: Update cow-amm subgraphs, add gnosis

## 1.5.2

### Patch Changes

-   c31cef8: new cow amm subgraph, fix surplus calc
-   d72fec7: fix scaling for cow pool data

## 1.5.1

### Patch Changes

-   40631b9: change fantom rpc
-   0fd0952: change cow amm subgraph to deployment id
-   64cdecc: more robust aura sync
-   4cfbf0e: add gUSDC apr

## 1.5.0

### Minor Changes

-   ed09091: split controllers, reload also syncs pool state

### Patch Changes

-   846b2ad: allow test env to use paid rpc
-   0b421c5: fix exact_out with getBestSwapPathVersion
-   2dbbb7c: fix initial cow amm sync
-   2366ee3: add cow crons to mainnet and adapt cron intervalls
-   f12b5b2: fix initUserBalances for local runs

## 1.4.3

### Patch Changes

-   43735c9: fix sfrax apr on fraxtal

## 1.4.2

### Patch Changes

-   3613c9f: reduce multicall batch size

## 1.4.1

### Patch Changes

-   6daa985: smaller chunks for pool fetching

## 1.4.0

### Minor Changes

-   d4caec8: Cow AMM aprs calculated from daily surplus

### Patch Changes

-   812bdba: return filename only for rateprovider review

## 1.3.2

### Patch Changes

-   6429e7a: Adding new pool filter tags tagIn and tagNotIn. These replace categoryIn/categoryNotIn removing enum constraint.
-   f816e93: changed the events query ordering from blockNumber to blockTimestamp to mitigate different chain height.
-   21da677: adding gyro config on gnosis chain
-   8389be2: using pool instead of global variables in ybTokenService
-   34a7a8c: fix aura and gauge user balance sync
-   5604fd9: exposing tags
-   57bbc2a: fix tracking of balance if last relic was transferred

## 1.3.1

### Patch Changes

-   95b752f: fixing missing files in metadata repo
-   480c22c: add cache to db query in SOR
-   2dc67f1: fix fantom blocks subgraph url

## 1.3.0

### Minor Changes

-   331c657: adding metadata categories from the github repo
-   2b1cbec: adding merkl reward aprs

### Patch Changes

-   4009872: adding missing fields to rate provider reviews
-   7397078: use subgraph deployment IDs instead of subgraph id
-   76c8176: Exclude current round from HiddenHand APRs
-   cbea2e0: limiting events query results set to 1000 records
-   bccc7a5: adding indexes to token related tables
-   614383b: breaking - making events query filter optional and allowing multiple chains

## 1.2.0

### Minor Changes

-   d8752b4: adding vebal as a staking option

### Patch Changes

-   b03f0ce: fix aura apr scaling
-   b3aedfc: Increase swap size to 100 USD for normalized liquidity calculation. Also only use pools that have >=1000USD tvl
-   e8e8bcc: adding SOR support for vault v3 - swaps only
-   ddb3616: moving snapshot syncing to a separate functions
-   e643603: updated AAVE subgraph URLs for getting token APRs
-   b071980: adding backsyncing task for filling up subgraph swaps
-   abc67d0: exposing aura pool id and shutdown flag for aura staking

## 1.1.0

### Minor Changes

-   a7711cb: Adding incentivized field to the pool response type
-   7fcea18: add cow-amm support for swaps, add, removes and snapshots. Also incorporate surplus

### Patch Changes

-   deb7c03: adjust syncs to newest vault v3 version
-   455bb0b: rename join/exit to add/remove for v3 subgraph
-   755e873: config fix
-   95e5636: fix: removing renamed vaultVersion column
-   4465dbf: adding poolToken -> balanceUSD
-   798c947: adding chain and user address as query params to vebal queries
-   0851e56: Update to newest v3 subgraph. Adjust balances etc from wei to floats
-   8961dfb: handle missing tokens in subgraph pools
-   1021114: fix voting apr timestamp to use UTC
-   489cf3e: removing duplicated vebal locks subgraph url

## 1.0.1

### Patch Changes

-   07a7fc9: make the workflow manual

## 1.0.0

### Major Changes

-   30b1148: First release of the Balancer backend / api v3

    This marks the first release for the API v3. With the release of ZEN, the following queries are deprecated and shall not be used anymore:

    -   poolGetSwaps
    -   poolGetBatchSwaps
    -   poolGetJoinExits
    -   poolGetFeaturedPoolGroups
    -   tokenGetPriceChartData
    -   tokenGetCandlestickChartData
    -   tokenGetTokenData
    -   tokenGetTokensData
    -   tokenGetProtocolTokenPrice

    The following fields and types are deprecated:

    -   vaultVersion
    -   investConfig
    -   GqlPoolInvestConfig
    -   GqlPoolInvestOption
    -   withdrawConfig
    -   GqlPoolWithdrawConfig
    -   GqlPoolWithdrawOption
    -   apr
    -   GqlPoolApr
    -   GqlPoolAprValue
    -   GqlPoolAprRange
    -   GqlPoolAprTotal
    -   tokens
    -   GqlPoolNestedUnion
    -   GqlPoolTokenComposableStableNestedUnion
    -   GqlPoolTokenBase
    -   GqlPoolToken
    -   GqlPoolTokenComposableStable

    See the gql files to find the suitable replacements.

### Minor Changes

-   34a7d70: update sftmx vaults when they are matured
