async function forAwait() {
    let first = new Promise((res, rej) => {
        setTimeout(() => {
            res("first");
        }, 15000)
    });

    let second = new Promise((res, rej) => {
        setTimeout(() => {
            res("second");
        }, 2000)
    });
    let third = new Promise((res, rej) => setTimeout(rej, 1000, "third")).catch(err=>err)
    //let third = Promise.reject("third").catch((err)=>err)

    let array = [first, second, third]
        for await (const item of array) {
            console.log(item)
        }
}

forAwait()