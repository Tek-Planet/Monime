-- Clean up the erroneous "My Business" that was auto-created for team member
DELETE FROM businesses 
WHERE id = 'a9a48929-2067-4882-86ab-ed6c6044166a' 
AND business_name = 'My Business'
AND owner_id = 'd687165a-b4c4-4635-8dc1-c602efc946c0';