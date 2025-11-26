import { DiceRollResult, getDieRollResult, RollDefinition } from "./rollTypes.js";

const rollDie = (numberOfSides: number) => Math.ceil(Math.random() * numberOfSides)

export const doRoll = (roll: RollDefinition): DiceRollResult => {
    const dieRollResults = [...Array(roll.numberOfDice)].map(() => rollDie(roll.numberOfSides));
    
    // If theres no drops or keeps then shortcut
    if (!roll.keepHighest && !roll.keepLowest && !roll.dropHighest && !roll.dropLowest) {
        return dieRollResults.reduce((acc, diceRollResult) => {
            acc.dieRollResults.push(getDieRollResult(diceRollResult, false));
            acc.sum += diceRollResult;
            return acc;
        }, <DiceRollResult>{
            dieRollResults: [],
            sum: roll.amountChange ?? 0
        });
    }

    let sliceLower = 0, sliceUpper = 0;
    // KeepHighest and KeepLowest are exclusive and will take higher priority than Drops
    if (roll.keepHighest && roll.keepHighest <= roll.numberOfDice)
        sliceLower = roll.numberOfDice - roll.keepHighest;
    else if (roll.keepLowest && roll.keepLowest <= roll.numberOfDice)
        sliceUpper = roll.numberOfDice - roll.keepLowest;
    else {
        sliceLower = roll.dropLowest && roll.dropLowest <= roll.numberOfDice ? roll.dropLowest : 0;
        sliceUpper = roll.dropHighest && roll.dropHighest <= roll.numberOfDice ? roll.dropHighest : 0;
    }

    const toDrop = dieRollResults.toSorted();
    // Notice we're using splice here to trim the lower and upper numbers as needed
    toDrop.splice(sliceLower, roll.numberOfDice-sliceLower-sliceUpper)

    const diceRollResult: DiceRollResult = {
        dieRollResults: [],
        sum: roll.amountChange ?? 0
    };

    dieRollResults.forEach(rollNumber => {
        const dropIndex = toDrop.indexOf(rollNumber)
        const shouldDrop = dropIndex !== -1;
        
        // Remove the used drop from the drops array
        if (shouldDrop) delete toDrop[dropIndex];

        diceRollResult.dieRollResults.push(getDieRollResult(rollNumber, shouldDrop));
        diceRollResult.sum += shouldDrop ? 0 : rollNumber;
    })

    return diceRollResult;
}


