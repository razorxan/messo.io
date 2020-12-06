export default interface MessoAck {
    resolve: (...args: any) => void,
    reject: (...args: any) => void,
}