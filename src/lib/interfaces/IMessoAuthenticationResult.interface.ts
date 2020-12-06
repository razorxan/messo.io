import MessoMeta from '../interfaces/IMessoMeta.interface';
import { MessoPeerComparison } from '../types'
export default interface MessoAuthenticationResult {
    meta: MessoMeta;
    peer: MessoPeerComparison
}