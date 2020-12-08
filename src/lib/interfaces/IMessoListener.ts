import { MessoEventHandler } from '../types';

export default interface IMessoListener {
    type: 'request' | 'message';
    event: string;
    handler: MessoEventHandler;
}