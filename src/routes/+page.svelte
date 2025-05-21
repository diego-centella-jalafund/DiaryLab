<script lang="ts">
    import { onMount } from 'svelte';
    import { Registry } from '$lib/auth/Registry';
    import AuthGuard from '$lib/auth/AuthGuard.svelte';
    import type { User } from '$lib/auth/User';

    let user: User | null = null;

    onMount(() => {
        Registry.auth.checkParams();
        Registry.auth.getUser().subscribe((data: User) => {
            user = data;
        });


    });
</script>

<AuthGuard manual={true} forceLogin={true}>
    <div slot="authed" let:user>
        <section class="hero">
        </section>

        <section class="workflow-section">
            <div class="content">
                <h2 class="section-title">DairyLab System</h2>
                <h1 class="main-title">How DiaryLab Can Improve Your Lab Workflow</h1>
                <p class="description">
                    How DiaryLab offers to you the way of manage a register system of Laboratories
                    having a easy way for add, edit and delete data and also see the data of a visible way
                    as a prediction visualization of a certain parameter of milk
                </p>
                <p class="description">
                    
                </p>
                <ul class="features-list">
                    <li><span class="checkmark">✔</span> Data Base Secure Software</li>
                    <li><span class="checkmark">✔</span> Adaptable to Small Laboratories</li>
                    <li><span class="checkmark">✔</span> Accurate Quality Control</li>
                    <li><span class="checkmark">✔</span> Sample Manager</li>
                    <li><span class="checkmark">✔</span> Perfect for register and manipulate templates</li>
                    <li><span class="checkmark">✔</span> Prediction Module</li>
                    <li><span class="checkmark">✔</span> Graphic System Integrated</li>
                    <li><span class="checkmark">✔</span> Alert Management Made Easy</li>
                    <li><span class="checkmark">✔</span> Guess mode Integrated</li>
                </ul>
            </div>
            <div class="mockup-images">
                <img 
                    src="/images/labDairy3.jpeg" 
                    alt="Lab Dashboard" 
                    class="mockup mockup-1" 
                />
                <img 
                    src="/images/labDairy2.png" 
                    alt="Lab Equipment" 
                    class="mockup mockup-2" 
                />
            </div>
        </section>

        <section class="additional-section">
            <h2>More About DiaryLab</h2>
            <p>
                This is a free trial demo for DiaryLab that helps you with automate and manage your laboratory without impediments
            </p>
        </section>
    </div>
    <div slot="not_authed">
        <p>log in for enter to DairyLab</p>
    </div>
</AuthGuard>

<style>
    .hero {
        text-align: center;
        padding: 4rem 2rem;
        background-color: #f8f9fa;
    }
    .hero h1 {
        color: #333;
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    .hero p {
        color: #666;
        font-size: 1.2rem;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
    }

    .workflow-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4rem 2rem;
        background-color: #ffffff;
        min-height: 600px; 
        max-width: 1200px; 
        margin: 0 auto;
    }
    .content {
        max-width: 50%;
    }
    .section-title {
        color: #ff6200;
        font-size: 1.2rem;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
    }
    .main-title {
        color: #007bff; 
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 1rem;
    }
    .description {
        color: #666;
        font-size: 1.1rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }
    .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    .features-list li {
        display: flex;
        align-items: center;
        font-size: 1rem;
        color: #333;
        margin-bottom: 0.5rem;
    }
    .checkmark {
        color: #ff6200;
        margin-right: 0.5rem;
        font-size: 1.2rem;
    }
    .mockup-images {
        max-width: 45%;
        position: relative;
        height: 400px; 
        display: flex; 
        flex-direction: column;
        gap: 1rem;
        align-items: flex-end; 
    }
    .mockup {
        position: relative;
        object-fit: cover; 
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        border: 1px solid red;
    }
    .mockup-1 {
        width: 100%;
        max-width: 400px;
        height: 200px; 
    }
    .mockup-2 {
        width: 100%;
        max-width: 300px;
        height: 150px;
        align-self: flex-start; 
    }

    .additional-section {
        padding: 4rem 2rem;
        background-color: #f8f9fa;
        text-align: center;
    }
    .additional-section h2 {
        color: #333;
        font-size: 2rem;
        margin-bottom: 1rem;
    }
    .additional-section p {
        color: #666;
        font-size: 1.1rem;
        line-height: 1.6;
        max-width: 800px;
        margin: 0 auto;
    }

    :global(body) {
        margin: 0;
        min-height: 100vh;
    }

    @media (max-width: 768px) {
        .workflow-section {
            flex-direction: column;
            align-items: center;
        }
        .content {
            max-width: 100%;
            margin-bottom: 2rem;
        }
        .mockup-images {
            max-width: 100%;
            height: auto; 
            align-items: center;
        }
        .mockup-1 {
            max-width: 300px;
            height: 150px;
        }
        .mockup-2 {
            max-width: 200px;
            height: 100px;
        }
    }
</style>