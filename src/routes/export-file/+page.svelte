<script>
    let fileInput;
    let message = '';
    let error = '';
  
    async function handleSubmit() {
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        error = 'Please select a CSV file to upload.';
        return;
      }
  
      const formData = new FormData();
      formData.append('csvFile', fileInput.files[0]);
  
      try {
        const response = await fetch('/api/raw-milk/upload', {
          method: 'POST',
          body: formData
        });
  
        const result = await response.json();
        if (response.ok) {
          message = result.message || 'File uploaded successfully!';
          error = '';
        } else {
          error = result.error || 'Failed to upload file.';
          message = '';
        }
      } catch (err) {
        error = 'An error occurred while uploading the file: ' + err.message;
        message = '';
      }
    }
  </script>
  
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold mb-4">Upload Raw Milk Data</h1>
    <p class="mb-4">upload a CSV from excel format</p>
    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <div>
        <label for="csvFile" class="block text-lg font-medium">Select CSV File:</label>
        <input
          type="file"
          id="csvFile"
          accept=".csv"
          bind:this={fileInput}
          class="mt-1 block w-full border rounded p-2"
        />
      </div>
      <button
        type="submit"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >Upload File </button>
    </form>
    {#if message}
      <p class="mt-4 text-green-600">{message}</p>
    {/if}
    {#if error}
      <p class="mt-4 text-red-600">{error}</p>
    {/if}
  </div>