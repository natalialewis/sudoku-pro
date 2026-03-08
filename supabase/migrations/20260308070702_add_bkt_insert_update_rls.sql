
  create policy "BKT probabilities are insertable by the owner"
  on "public"."bkt_probabilities"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "BKT probabilities are updatable by the owner"
  on "public"."bkt_probabilities"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



