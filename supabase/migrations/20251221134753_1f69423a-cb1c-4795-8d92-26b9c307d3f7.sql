-- Delete the business created by organization member before the trigger was in place
DELETE FROM public.businesses 
WHERE id = '01b55371-f150-4939-bae0-36d9e30d3421' 
AND owner_id = 'd687165a-b4c4-4635-8dc1-c602efc946c0';