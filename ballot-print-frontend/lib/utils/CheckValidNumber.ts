

export function checkValidNumber(id: any) {
    if (!id || isNaN(parseInt(id)) || parseInt(id).toString() !== id.toString() || id == 0 || id == "new") {
        return false
    } else {
        return true
    }
}