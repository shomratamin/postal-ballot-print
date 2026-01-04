export default function numberWithCommas(x: number) {
    let numStr = x.toString();
    let lastThree = numStr.substring(numStr.length - 3);
    let otherNumbers = numStr.substring(0, numStr.length - 3);

    if (otherNumbers !== "") {
        lastThree = "," + lastThree;
    }

    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
}