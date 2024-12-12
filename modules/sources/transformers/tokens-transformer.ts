import { VaultPoolFragment as VaultSubgraphPoolFragment } from '../subgraphs/balancer-v3-vault/generated/types';
import { Chain } from '@prisma/client';

/**
 * Extracts pool tokens from the vault subgraph pools and adds the BPT token as well.
 * Return value is used to store all the token definitions in the database.
 *
 * @param vaultSubgraphPools
 * @param chain
 * @returns All tokens from the pools including the BPT token
 */
export function tokensTransformer(
    vaultSubgraphPools: Pick<VaultSubgraphPoolFragment, 'tokens' | 'name' | 'symbol' | 'address'>[],
    chain: Chain,
) {
    return vaultSubgraphPools.flatMap((pool) => {
        return [
            ...pool.tokens.flatMap((token) => [
                {
                    address: token.address,
                    decimals: token.decimals,
                    name: token.name,
                    symbol: token.symbol,
                    chain: chain,
                    underlyingTokenAddress: token.buffer?.underlyingToken?.address,
                },
                // Underlying token is needed for getting the pricing data based on the underlying token
                ...(token.buffer?.underlyingToken
                    ? [
                          {
                              address: token.buffer.underlyingToken.address,
                              decimals: token.buffer.underlyingToken.decimals,
                              name: token.buffer.underlyingToken.name,
                              symbol: token.buffer.underlyingToken.symbol,
                              chain: chain,
                          },
                      ]
                    : []),
            ]),
            {
                address: pool.address,
                decimals: 18,
                name: pool.name,
                symbol: pool.symbol,
                chain: chain,
            },
        ];
    });
}
