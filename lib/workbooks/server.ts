import type {SupabaseClient} from '@supabase/supabase-js';
import {WORKBOOK_PAGE_SIZE} from './query';
export type WorkbookBatch={id:string;filename:string;expected_rows:number;status:string;rights_status:string;created_at:string;data_as_of:string|null;source_note:string;file_sha256:string;audit_summary?:Record<string,unknown>;sheet_manifest:{name:string;rows:number}[]};
export type WorkbookRow={id:string;sheet_name:string;sheet_row:number;name:string;suggested_place_type:string;source_rating:number|null;source_review_count:number|null;source_maps_url:string|null;raw_values:unknown[];review_status:string;matched_place_id?:string|null;public_place?:{slug:string;publication_status:string}|null};
/** Only call after getAdminContext. Session client + database Admin RLS, never service role. */
export async function loadWorkbookData(supabase:SupabaseClient,query:{batch:string|null;sheet:string;page:number}){
 const batches=await supabase.from('workbook_import_batches').select('id,filename,expected_rows,status,rights_status,created_at,data_as_of,source_note,file_sha256,sheet_manifest,audit_summary').eq('status','ready').order('created_at',{ascending:false}).limit(50).abortSignal(AbortSignal.timeout(8000));
 if(batches.error)throw new Error('Workbook archive unavailable');
 const batch=query.batch?(batches.data as WorkbookBatch[]).find(b=>b.id===query.batch):(batches.data as WorkbookBatch[])[0];
 if(!batch)return{batches:batches.data as WorkbookBatch[],batch:null,rows:[] as WorkbookRow[],total:0,page:query.page};
 if(query.sheet&&!batch.sheet_manifest.some(s=>s.name===query.sheet))throw new Error('Invalid workbook sheet');
 let request=supabase.from('workbook_import_rows').select('id,sheet_name,sheet_row,name,suggested_place_type,source_rating,source_review_count,source_maps_url,raw_values,review_status,matched_place_id,public_place:places!workbook_import_rows_matched_place_id_fkey(slug,publication_status)',{count:'exact'}).eq('batch_id',batch.id);
 if(query.sheet)request=request.eq('sheet_name',query.sheet);
 const result=await request.order('sheet_name').order('sheet_row').range((query.page-1)*WORKBOOK_PAGE_SIZE,query.page*WORKBOOK_PAGE_SIZE-1).abortSignal(AbortSignal.timeout(8000));
 if(result.error||result.count===null)throw new Error('Workbook rows unavailable');
 const summary=await supabase.rpc('admin_workbook_publication_summary',{p_batch:batch.id}).abortSignal(AbortSignal.timeout(8000));
 if(summary.error)throw new Error('Workbook publication summary unavailable');
 return{batches:batches.data as WorkbookBatch[],batch,rows:result.data.map(row=>({...row,public_place:Array.isArray(row.public_place)?row.public_place[0]??null:row.public_place})) as WorkbookRow[],total:result.count,page:query.page,summary:summary.data as {published:number;linked:number;pending:number}};
}
