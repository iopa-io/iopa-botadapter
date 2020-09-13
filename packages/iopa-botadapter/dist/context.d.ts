import { Activity } from 'iopa-botadapter-schema';
import { IopaContext } from 'iopa-types';
import { Adapter, IopaBotAdapterContext } from 'iopa-botadapter-types';
/** Convert plain IopaContext into a method-enhanced IopaBotAdapterContext */
export declare function toIopaBotAdapterContext(plaincontext: IopaContext, adapter: Adapter, activity: Activity): IopaBotAdapterContext;
