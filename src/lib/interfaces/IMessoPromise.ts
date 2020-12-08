export default interface IMessoPromise {
    resolve: (...args: any) => void,
    reject: (...args: any) => void,
}