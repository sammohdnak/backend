import { GraphQLClient } from 'graphql-request';

import pulseChainConfig from '../../../config/pulsechain';
import pulseChainV4Config from '../../../config/pulsechainV4';

import _ from 'lodash';
import { VotingEscrowLock_OrderBy, OrderDirection, getSdk } from './generated/veBal-locks-subgraph-types';
import moment from 'moment';
import { env } from '../../../apps/env';


const isMainnetChain = env.IS_MAINNET_CHAIN == 'true'

const config = isMainnetChain ? pulseChainConfig : pulseChainV4Config
export class VeBalLocksSubgraphService {
    constructor() { }

    async getAllveBalHolders(): Promise<{ user: string; balance: string }[]> {
        const now = moment().unix();
        let locks: { user: string; balance: string }[] = [];
        const limit = 1000;
        let hasMore = true;
        let id = `0`;

        while (hasMore) {
            const response = await this.sdk.VotingEscrowLocks({
                first: limit,
                orderBy: VotingEscrowLock_OrderBy.id,
                orderDirection: OrderDirection.asc,
                where: {
                    unlockTime_gt: `${now}`,
                    id_gt: id,
                },
            });

            locks = [
                ...locks,
                ...response.votingEscrowLocks.map((lock) => ({
                    user: lock.user.id,
                    balance: lock.lockedBalance,
                })),
            ];

            if (response.votingEscrowLocks.length < limit) {
                hasMore = false;
            } else {
                id = response.votingEscrowLocks[response.votingEscrowLocks.length - 1].id;
            }
        }

        return locks;
    }

    public async getMetadata() {
        const { meta } = await this.sdk.VebalGetMeta();

        if (!meta) {
            throw new Error('Missing meta data');
        }
        return meta;
    }

    public get sdk() {
        const client = new GraphQLClient(config.subgraphs.gauge ?? '');

        return getSdk(client);
    }
}

export const veBalLocksSubgraphService = new VeBalLocksSubgraphService();
