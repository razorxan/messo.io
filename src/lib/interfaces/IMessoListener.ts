import { MessoEventHandler, MessoListenerType, MessoHandlerParamType } from '../';

export default interface MessoListener {
    type: MessoListenerType;
    event: string;
    handler: MessoEventHandler<any>;
}