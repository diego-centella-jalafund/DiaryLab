<script lang="ts">
  import { Registry } from '$lib/auth/Registry';
  import type { User } from '$lib/auth/User';
  import { onMount } from 'svelte';

  let user: User | null = null;
  let fileInput: HTMLInputElement;
  let message = '';
  let error = '';
  let isLoading = false;

  onMount(() => {
      Registry.auth.checkParams();
      Registry.auth.getUser().subscribe((data: User) => {
          user = data;
          if (!user) {
              console.log('No user authenticated, initiating login...');
              Registry.auth.login({ redirectUri: window.location.href }).catch((error) => {
                  console.error('Login initiation failed:', error);
                  error = 'Failed to initiate login. Please try again.';
              });
          }
      });
  });

  async function handleSubmit(retryCount = 0) {
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
          error = 'Please select a CSV file to upload.';
          return;
      }

      const file = fileInput.files[0];
      if (!file.name.endsWith('.csv')) {
          error = 'Please upload a valid CSV file.';
          return;
      }

      isLoading = true;
      error = '';
      message = '';

      try {
          let token = Registry.auth.getToken();
          if (!token) {
              console.warn('No token found in localStorage, redirecting to login...');
              error = 'No authentication token available. Redirecting to login...';
              await Registry.auth.login({ redirectUri: window.location.href });
              return;
          }

          console.log('Token before refresh:', token);

          let refreshed = false;
          try {
              refreshed = await Registry.auth.refreshToken();
              if (refreshed) {
                  token = Registry.auth.getToken();
                  console.log('Token after refresh:', token);
              } else {
                  console.warn('Token refresh failed, possibly due to expired refresh token');
              }
          } catch (refreshError) {
              console.error('Error during token refresh:', refreshError.message || refreshError);
          }

          if (!refreshed && retryCount < 1) {
              try {
                  refreshed = await Registry.auth.refreshToken();
                  if (refreshed) {
                      token = Registry.auth.getToken();
                      console.log('Token after retry refresh:', token);
                  }
              } catch (retryError) {
                  console.error('Retry token refresh failed:', retryError.message || retryError);
              }
          }

          const formData = new FormData();
          formData.append('csvFile', file);

          const response = await fetch('/api/raw-milk/upload', {
              method: 'POST',
              body: formData,
              headers: {
                  Authorization: `Bearer ${token}`
              }
          });

          const result = await response.json();
          if (response.ok) {
              message = 'File uploaded successfully!';
              if (result.rowCount) {
                  message += ` Imported ${result.rowCount} rows.`;
              }
              error = '';
          } else {
              console.error('API response:', result);
              if (response.status === 401 && (result.reason === 'jwt expired' || result.reason === 'token_invalid') && retryCount < 1) {
                  console.warn('Token invalid or expired');
                  return handleSubmit(retryCount + 1);
              }
              throw new Error(result.error || result.message || `Failed to upload file: ${response.status}`);
          }
      } catch (err) {
          console.error('Upload error:', err);
          error = err instanceof Error ? err.message : 'An unknown error occurred while uploading the file.';
          message = '';
          if (error.includes('Session expired') || error.includes('Invalid token')) {
              console.warn('Authentication error detected, redirecting to login');
              await Registry.auth.login({ redirectUri: window.location.href });
          }
      } finally {
          isLoading = false;
      }
  }
</script>
  
<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-4">Subir Archivo - Leche cruda</h1>
  <p class="mb-4">Subir un archivo en formato .CSV</p>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="csvFile" class="block text-lg font-medium">Seleccionar un archivo .CSV</label>
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
    >
      Subir Archivo
    </button>
  </form>
  {#if message}
    <p class="mt-4 text-green-600">{message}</p>
  {/if}
  {#if error}
    <p class="mt-4 text-red-600">{error}</p>
  {/if}

  <div class="mt-6 flex justify-center gap-6">
    <img
      src="images/informelechecruda.png"
      alt="Example CSV file format (Left)"
      class="max-w-xs h-auto rounded shadow-md"
    />
    <img
      src="images/transformedtoCSV.png"
      alt="Example CSV file format (Right)"
      class="max-w-xs h-auto rounded shadow-md"
    />
  </div>
  <div class="mt-6">
    <h2 class="text-xl font-semibold mb-2">Pasos para subir un archivo CSV</h2>
    <ul class="list-disc list-inside space-y-2 text-gray-700">
       <li>Tener preparado el archivo Excel a subir con las columnas requeridas como en la imagen de la izquierda</li>
      <li>Guardar el archivo en formato .CSV, como en la imagen de arriba derecha</li>
      <li>Click en el boton "Choose file" y subir el archivo .CSV anteriormente</li>
      <li>Click en el boton "Subir Archivo" para procesar el archivo</li>
    </ul>
  </div>

  
</div>
<style>
  .container {
    max-width: 100%; 
    padding-left: 1rem;
    padding-right: 1rem;
  }
  .flex {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  img {
    width: 40%; 
    max-width: 45vw; 
    height: auto;
  }
  ul {
    max-width: 600px;
    margin: 0 auto;
  }
</style>