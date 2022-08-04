let { DateTime } = require("luxon");
const { nanoid } = require("nanoid");

function separateFreeFromPaid(subs) {
    console.log(subs)
    let tieredSubs = subs.map(sub => tierCompany(sub))
    console.log(tieredSubs)
    let freeSubs = [];
    let paidSubs = [];
    for (const tieredSub of tieredSubs) {
        if (tieredSub.tier === "free") {
            freeSubs.push(tieredSub)
        } else {
            paidSubs.push(tieredSub)
        }
    }
    return { freeSubs, paidSubs }
}

function tierCompany(sub) {
    let { tier, qty = 1, frequency = "monthly", ...rest } = sub

    let tierObj = tierObjs.find(obj => obj.tier === tier);
    let price =
        tierObj.prices.find(priceObj => priceObj.frequency === frequency).price * qty;
    if (tierObj) {
        let expiresOn = getExpiresOn({ qty, frequency });
        sub.expiresOn = expiresOn
        sub.price = price
        sub.qty = qty;
        sub.id=nanoid()
        sub.frequency = frequency
    }
    console.log(sub);
    return sub
}

function getExpiresOn({ qty, frequency }) {
    let dt = DateTime.now();
    switch (frequency) {
        case "weekly":
            dt = dt.plus({ week: qty }).toJSDate()
            break;
        case "monthly":
            dt = dt.plus({ month: qty }).toJSDate()
            break;
        case "quarterly":
            dt = dt.plus({ month: qty * 3 }).toJSDate()
            break;
        case "biannually":
            dt = dt.plus({ month: qty * 6 }).toJSDate()
            break;
        case "yearly":
            dt = dt.plus({ year: qty }).toJSDate()
            break;
        case "biennially":
            dt = dt.plus({ year: qty * 2 }).toJSDate()
            break;
        default:
            dt = dt.toJSDate()
            break;
    }
    return dt;
}

function getNumberOfAvailableCompanylimit(tier) {
    return tierObjs.find(obj => obj.tier === tier).numOfCompanyUnits;
}

let tierObjs = [
    {
        tier: "free", level: 100, desc: "Free tier", numOfCompanyUnits: 1, prices: [
            { frequency: "weekly", desc: "Weekly", price: 0, },
            { frequency: "monthly", desc: "Monthly", price: 0, },
            { frequency: "quarterly", desc: "Quarterly", price: 0, },
            { frequency: "biannually", desc: "Biannually", price: 0, },
            { frequency: "yearly", desc: "Yearly", price: 2800, },
            { frequency: "biennially", desc: "Biennially", price: 0, },
        ]
    },
    {
        tier: "bronze", level: 1, price: 400, desc: "Bronze", numOfCompanyUnits: 2, prices: [
            { frequency: "weekly", desc: "Weekly", price: 100, },
            { frequency: "monthly", desc: "Monthly", price: 400, },
            { frequency: "quarterly", desc: "Quarterly", price: 1200, },
            { frequency: "biannually", desc: "Biannually", price: 1500, },
            { frequency: "yearly", desc: "Yearly", price: 2800, },
            { frequency: "biennially", desc: "Biennially", price: 5500, },
        ]
    },
    {
        tier: "silver", level: 2, price: 700, desc: "Silver", numOfCompanyUnits: 3, prices: [
            { frequency: "weekly", desc: "Weekly", price: 200 },
            { frequency: "monthly", desc: "Monthly", price: 800, },
            { frequency: "quarterly", desc: "Quarterly", price: 2400, },
            { frequency: "biannually", desc: "Biannually", price: 3000, },
            { frequency: "yearly", desc: "Yearly", price: 5500, },
            { frequency: "biennially", desc: "Biennially", price: 10000, },
        ]
    },
    {
        tier: "gold", level: 3, price: 1000, desc: "Gold", numOfCompanyUnits: 5, prices: [
            { frequency: "weekly", desc: "Weekly", price: 300, },
            { frequency: "monthly", desc: "Monthly", price: 1200, },
            { frequency: "quarterly", desc: "Quarterly", price: 4500, },
            { frequency: "biannually", desc: "Biannually", price: 5500, },
            { frequency: "yearly", desc: "Yearly", price: 7500, },
            { frequency: "biennially", desc: "Biennially", price: 12000, },
        ]
    },
]

module.exports = {
    tierCompany, separateFreeFromPaid,
    getExpiresOn,
    getNumberOfAvailableCompanylimit
}