import { EventHandler, ListenerType } from '../';

export default interface Listener {
    type: ListenerType;
    event: string;
    handler: EventHandler<any>;
}