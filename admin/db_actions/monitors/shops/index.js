const composeEmail = require("../../../../utils/emailServices/composeEmail");
const newShopAdd = require("./newShopAdd");

function startWatchingShops() {
    const { mongoClient, waleprjDB } = require("..");
    const shopsCol = waleprjDB.collection("shops")
    const shopsChangeStream = shopsCol.watch();
    shopsChangeStream.on("change", evt => {
        console.log(evt.operationType === "insert");
        switch (evt.operationType) {
            case "insert":
                console.log("tftyfft")
                newShopAdd(evt)
                break;

            default:
                break;
        }
    });
}


module.exports = startWatchingShops;