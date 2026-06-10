/** Custom id key for the location editor panel buttons (delimited by ':') */
export const LocationPanelCustomIdKey = "locpanel";

/** Identifies which panel button was pressed / which modal page to show */
export enum LocationPanelAction {
    EditDetails = "details",
    Rename = "rename",
    Delete = "delete",
    Done = "done",
    ManageImages = "images",
    AddImage = "img-add",
    DeleteImage = "img-del",
    DoneImages = "img-done",
}

/** Text input custom ids used within the location editor modals */
export enum LocationFieldId {
    Name = "name",
    Address = "address",
    Description = "description",
    Keywords = "keywords",
    Hours = "hours",
    Url = "url",
    Image = "image",
}
