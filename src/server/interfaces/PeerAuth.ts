export default interface PeerAuth {
    /** Unique identifier of the peer */
    id: string;
    meta?: {
        [key: string]: any;
    }
};