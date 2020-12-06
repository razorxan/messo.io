import { MessoEventHandler } from '../types';

export default interface MessoListener {
    type: 'request' | 'message';
    event: string;
    handler: MessoEventHandler;
}