import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000/api/v1';

async function runTest() {
    console.log('--- Starting API Test ---');

    // 1. Auth Guest
    console.log('\n[3.1] Creating User (Guest Auth)...');
    const deviceId = randomUUID();
    const authRes = await fetch(`${API_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
    });
    if (!authRes.ok) throw new Error(`Auth failed: ${authRes.statusText}`);
    const authJson = await authRes.json();
    const authData = authJson.data;
    console.log('Auth Response:', JSON.stringify(authData, null, 2));
    const token = authData.accessToken;
    const userId = authData.user.id;
    console.log('User created:', userId);
    console.log('Token obtained');

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    // 2. Create Household
    console.log('\n[3.2] Creating Household...');
    const hhRes = await fetch(`${API_URL}/household`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Test Household' }),
    });
    if (!hhRes.ok) throw new Error(`Create Household failed: ${await hhRes.text()}`);
    const household = (await hhRes.json()).data;
    console.log('Household created:', household.id, household.name);

    // 2.1 Re-authenticate to get token with householdId
    console.log('[3.2.1] Re-authenticating to update token...');
    const authRes2 = await fetch(`${API_URL}/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
    });
    if (!authRes2.ok) throw new Error(`Re-auth failed: ${await authRes2.text()}`);
    const authData2 = (await authRes2.json()).data;
    const newToken = authData2.accessToken;
    headers['Authorization'] = `Bearer ${newToken}`;
    console.log('Token updated with household info');

    // 2.2 Update Household
    console.log('[3.2.2] Updating Household...');
    const hpRes = await fetch(`${API_URL}/household`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: 'Updated Household' }),
    });
    if (!hpRes.ok) throw new Error(`Update Household failed: ${await hpRes.text()}`);
    console.log('Household updated');

    // 3.3 Shopping List
    console.log('\n[3.3.1] Create Shopping List...');
    const listRes = await fetch(`${API_URL}/shopping-lists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: 'Groceries', color: '#FF0000' }),
    });
    if (!listRes.ok) throw new Error(`Create List failed: ${await listRes.text()}`);
    const list = (await listRes.json()).data;
    console.log('List created:', list.id);

    console.log('[3.3.1] Get List Details...');
    const getListRes = await fetch(`${API_URL}/shopping-lists/${list.id}`, { headers });
    if (!getListRes.ok) throw new Error(`Get List failed`);
    console.log('List fetched OK');

    console.log('\n[3.3.2] Add Items (Custom Item Logic)...');
    const addItemsRes = await fetch(`${API_URL}/shopping-lists/${list.id}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            items: [
                { name: 'Milk', quantity: 1 }, // Standard/Simple
                { name: 'My Secret Sauce', quantity: 2 }, // Custom
            ],
        }),
    });
    if (!addItemsRes.ok) throw new Error(`Add Items failed: ${await addItemsRes.text()}`);
    const added = (await addItemsRes.json()).data;
    console.log('Items added:', added.addedItems.length);

    console.log('\n[3.3.3] Fetch User Custom Items...');
    const customItemsRes = await fetch(`${API_URL}/shopping-items/custom`, { headers });
    if (!customItemsRes.ok) throw new Error(`Get Custom Items failed: ${await customItemsRes.text()}`);
    const customItems = (await customItemsRes.json()).data;
    console.log('Custom Items count:', customItems.length);
    const secretSauce = customItems.find((i: any) => i.name === 'My Secret Sauce');
    if (!secretSauce) throw new Error('Custom item "My Secret Sauce" not found in user items!');
    console.log('Found custom item:', secretSauce.name);

    console.log('\n[3.3.4] Edit List (Update Item)...');
    const itemId = added.addedItems[0].id;
    const updateItemRes = await fetch(`${API_URL}/shopping-items/${itemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isChecked: true })
    });
    if (!updateItemRes.ok) throw new Error('Update Item failed');
    console.log('Item updated (checked)');

    // Verify fetch modified list
    const getListRes2 = await fetch(`${API_URL}/shopping-lists/${list.id}`, { headers });
    const list2 = (await getListRes2.json()).data;
    if (!list2.items.find((i: any) => i.id === itemId).isChecked) throw new Error('Item check not persisted');
    console.log('List verification passed');

    console.log('\n[3.3.4.1] Delete Item...');
    const delItemRes = await fetch(`${API_URL}/shopping-items/${itemId}`, { method: 'DELETE', headers });
    if (!delItemRes.ok) throw new Error('Delete Item failed');
    console.log('Item deleted');

    console.log('\n[3.3.5] Delete List...');
    const delListRes = await fetch(`${API_URL}/shopping-lists/${list.id}`, { method: 'DELETE', headers });
    if (!delListRes.ok) throw new Error('Delete List failed');
    console.log('List deleted');

    // 3.4 Chores
    console.log('\n[3.4.1] Create Chore...');
    // Check dto structure. title, dueDate?
    const choreRes = await fetch(`${API_URL}/chores`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: 'Clean Kitchen' })
    });
    if (!choreRes.ok) throw new Error(`Create Chore failed: ${await choreRes.text()}`);
    const chore = (await choreRes.json()).data;
    console.log('Chore created:', chore.id);

    console.log('[3.4.2] Get & Edit Chore...');
    await fetch(`${API_URL}/chores/${chore.id}`, { headers });
    // Edit title
    const editChoreRes = await fetch(`${API_URL}/chores/${chore.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: 'Clean Kitchen (Updated)' })
    });
    if (!editChoreRes.ok) throw new Error(`Edit Chore failed: ${await editChoreRes.text()}`);

    // Toggle completion
    const toggleRes = await fetch(`${API_URL}/chores/${chore.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ isCompleted: true })
    });
    if (!toggleRes.ok) throw new Error(`Toggle Chore failed: ${await toggleRes.text()}`);
    console.log('Chore edited');

    console.log('[3.4.3] Delete Chore...');
    const delChoreRes = await fetch(`${API_URL}/chores/${chore.id}`, { method: 'DELETE', headers });
    if (!delChoreRes.ok) throw new Error('Delete Chore failed');
    console.log('Chore deleted');

    // 3.5 Recipes
    console.log('\n[3.5.1] Create Recipe...');
    const recipeRes = await fetch(`${API_URL}/recipes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            title: 'Pancakes',
            ingredients: ['Flour', 'Milk', 'Eggs'],
            instructions: ['Mix', 'Fry']
        })
    });
    if (!recipeRes.ok) throw new Error(`Create Recipe failed: ${await recipeRes.text()}`);
    const recipe = (await recipeRes.json()).data;
    console.log('Recipe created:', recipe.id);

    console.log('[3.5.2] Get & Edit Recipe...');
    await fetch(`${API_URL}/recipes/${recipe.id}`, { headers });
    const editRecipeRes = await fetch(`${API_URL}/recipes/${recipe.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ prepTime: 15 })
    });
    if (!editRecipeRes.ok) throw new Error('Edit Recipe failed');
    console.log('Recipe edited');

    console.log('[3.5.3] Delete Recipe...');
    const delRecipeRes = await fetch(`${API_URL}/recipes/${recipe.id}`, { method: 'DELETE', headers });
    if (!delRecipeRes.ok) throw new Error('Delete Recipe failed');
    console.log('Recipe deleted');

    // 4. Health
    console.log('\n[4] Health Check...');
    const healthRes = await fetch(`${API_URL}/health`);
    if (!healthRes.ok) throw new Error(`Health Check failed: ${await healthRes.text()}`);
    console.log('Health status:', (await healthRes.json()).status);

    // 5. Dashboard
    console.log('\n[5] Dashboard Summary...');
    const dashRes = await fetch(`${API_URL}/dashboard/summary`, { headers });
    if (!dashRes.ok) throw new Error(`Dashboard failed: ${await dashRes.text()}`);
    console.log('Dashboard summary fetched');

    // 6. Import
    console.log('\n[6] Import...');
    const importPayload = {
        shoppingLists: [
            {
                id: 'local-list-1',
                name: 'Imported List',
                items: [{ name: 'Imported Item', quantity: 1 }],
            },
        ],
        recipes: [
            {
                id: 'local-recipe-1',
                title: 'Imported Recipe',
                ingredients: [],
                instructions: [],
            },
        ],
    };
    const importRes = await fetch(`${API_URL}/import`, {
        method: 'POST',
        headers,
        body: JSON.stringify(importPayload),
    });
    if (!importRes.ok) throw new Error(`Import failed: ${await importRes.text()}`);
    const importResult = (await importRes.json()).data;
    console.log('Import result:', JSON.stringify(importResult));

    console.log('\n--- ALL TESTS PASSED ---');
}

runTest().catch(e => {
    console.error('TEST FAILED:', e);
    process.exit(1);
});
