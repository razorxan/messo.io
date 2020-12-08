import { MessoPeerComparison, IMessoMeta } from '../';

export default interface IMessoAuthenticationResult {
    meta: IMessoMeta;
    peer: MessoPeerComparison
}