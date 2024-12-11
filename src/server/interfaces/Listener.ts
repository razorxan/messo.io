import { EventHandler, ListenerType } from "../types";

export default interface Listener {
    type: ListenerType;
    event: string;
    handler: EventHandler<any>;
}