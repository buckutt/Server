module.exports = {
    user_id  : '04ab4de8-095e-4ce3-b7d5-d0374ae89fc5',
    period_id: '39c93c99-70a2-4b15-bf60-1e5bf1d82692',
    event_id : 'a28a9a52-79a8-4115-91cc-9833edab39d9',
    item     : obj => Object.assign(obj, {
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        active    : 1
    })
};
