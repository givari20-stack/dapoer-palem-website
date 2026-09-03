# Menu CSV import

Download the header-only CSV template from **Admin → Menu → Download CSV Template**. The import keeps the existing limits of 1,000 rows and 2 MB per file.

The `category` column accepts:

- an existing category name;
- an existing category slug; or
- a new category name.

Names are matched without regard to capitalization, leading/trailing spaces, or repeated whitespace. Distinct names are not merged merely because they generate the same slug.

New category references appear under **New Categories** in preview. They are created only when an authorized user selects them and confirms the import. Imported categories start as active drafts, so they do not appear publicly until separately published.

The confirmed operation creates approved categories, resolves category IDs, imports or updates eligible menu items, and writes revisions and audit records in one database transaction. Any database conflict rolls back the complete operation.
