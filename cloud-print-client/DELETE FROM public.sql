DELETE FROM public.orders WHERE 1=1;
DELETE FROM public.addresses WHERE 1=1;
DELETE FROM public.returning_addresses WHERE 1=1;
DELETE FROM public.order_events WHERE 1=1;
DELETE FROM public.order_batches WHERE 1=1;
DELETE FROM public.print_batch_jobs WHERE 1=1;
UPDATE public.barcode_repos SET is_used = 0 WHERE 1=1;
