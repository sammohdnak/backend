import { Contract } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import abi from './abi/balancerTokenAdmin.json';
import { networkContext } from '../network/network-context.service';

export async function getInflationRate(): Promise<BigNumber> {
    if (networkContext.isMainnet) {
        return BigNumber.from(0);
    } else {
        return BigNumber.from(0);
    }
}
