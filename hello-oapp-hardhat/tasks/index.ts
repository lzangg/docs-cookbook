import { BigNumber } from 'ethers'
import { task } from 'hardhat/config'

import { createGetHreByEid, createProviderFactory, getEidForNetworkName } from '@layerzerolabs/devtools-evm-hardhat'
import { Options } from '@layerzerolabs/lz-v2-utilities'

task('oapp:read', 'read message stored in MyOApp')
    .addParam('contractA', 'contract address on network A')
    .addParam('contractB', 'contract address on network B')
    .addParam('networkA', 'name of the network A')
    .addParam('networkB', 'name of the network B')
    .setAction(async (taskArgs, { ethers }) => {
        const eidA = getEidForNetworkName(taskArgs.networkA)
        const eidB = getEidForNetworkName(taskArgs.networkB)
        const contractA = taskArgs.contractA
        const contractB = taskArgs.contractB
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signerA = (await providerFactory(eidA)).getSigner()
        const signerB = (await providerFactory(eidB)).getSigner()

        const oappContractAFactory = await ethers.getContractFactory('MyOApp', signerA)
        const oappContractBFactory = await ethers.getContractFactory('MyOApp', signerB)

        const oappA = oappContractAFactory.attach(contractA)
        const oappB = oappContractBFactory.attach(contractB)

        const dataOnOAppA = await oappA.data()
        const dataOnOAppB = await oappB.data()
        console.log({
            dataOnOAppA,
            dataOnOAppB,
        })
    })

// send messages from a contract on one network to another
task('oapp:send', 'test send')
    // contract to send a message from
    .addParam('contractA', 'contract address on network A')
    // network that sender contract resides on
    .addParam('networkA', 'name of the network A')
    // network that receiver contract resides on
    .addParam('networkB', 'name of the network B')
    // message to send from network a to network b
    .addParam('message', 'message to send from network A to network B')
    .setAction(async (taskArgs, { ethers }) => {
        const eidA = getEidForNetworkName(taskArgs.networkA)
        const eidB = getEidForNetworkName(taskArgs.networkB)
        const contractA = taskArgs.contractA
        const environmentFactory = createGetHreByEid()
        const providerFactory = createProviderFactory(environmentFactory)
        const signer = (await providerFactory(eidA)).getSigner()

        const oappContractFactory = await ethers.getContractFactory('MyOApp', signer)
        const oapp = oappContractFactory.attach(contractA)

        const options = Options.newOptions().addExecutorLzReceiveOption(200000, 0).toHex().toString()
        const [nativeFee] = await oapp.quote(eidB, 'Hello World', options, false)
        console.log(BigNumber.from(nativeFee))
        console.log(BigNumber.from(nativeFee).mul(30).div(100).add(BigNumber.from(nativeFee)))
        const r = await oapp.send(eidB, 'Hello World', options, {
            value: BigNumber.from(nativeFee).mul(30).div(100).add(BigNumber.from(nativeFee)),
        })
        console.log(`Tx initiated. See: https://layerzeroscan.com/tx/${r.hash}`)
    })
