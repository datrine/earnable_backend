/**
 * @type {import("isomorphic-unfetch").default}
 */
const fetch=require("isomorphic-unfetch");

let sendSMS=async()=>{
    try {
        fetch("http://api.ebulksms.com:8080/sendsms.json")
    } catch (error) {
        console.log(error)
    }
}