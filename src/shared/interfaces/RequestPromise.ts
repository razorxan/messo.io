export default interface RequestPromise {
    resolve: (...args: any) => void;
    reject: (...args: any) => void;
}