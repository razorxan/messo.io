export default interface MessoPeerAuth {
    /** Unique identifier of the peer */
    id: string;
    meta?: {
        [key: string]: any;
    }
};