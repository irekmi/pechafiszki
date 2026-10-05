/** What SCR-21's add-category form gets back from API-27 (`useActionState`). Not a `"use server"` module. */
export type AddCategoryState = { name: string; error?: string; addedId?: number };

export const emptyAddCategoryState: AddCategoryState = { name: "" };
