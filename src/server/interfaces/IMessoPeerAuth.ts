export default interface IMessoPeerAuth {
    /** Unique identifier of the peer */
    id: string;
    meta?: {
        [key: string]: any;
    }
};