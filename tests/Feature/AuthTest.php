<?php

namespace Tests\Feature;

use Carbon\Carbon;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Str;
use App\Models\PasswordReset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use PHPOpenSourceSaver\JWTAuth\JWTAuth;
use Illuminate\Support\Facades\Password;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_user_registration()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test User',
            'username' => 'testuser',
            'email' => 'test@example.com',
            'password' => 'Test_ing!!@108290!!',
            'password_confirmation' => 'Test_ing!!@108290!!',
            'role' => 'staff',
        ]);

        $response->assertStatus(201);
        $response->assertJsonMissing(['password']);
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'username' => 'testuser',
        ]);

        $user = User::where('email', 'test@example.com')->first();
        $this->assertTrue(Hash::check('Test_ing!!@108290!!', $user->password));
        $this->assertMatchesRegularExpression('/^[\w.+-]+@[\w-]+\.[\w.-]+$/', $user->email);
    }

    public function test_registration_with_existing_email()
    {
        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Another User',
            'username' => 'anotheruser',
            'email' => 'test@example.com',
            'password' => 'Another@1234',
            'role' => 'staff',
        ]);

        $response->assertStatus(400);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_registration_with_weak_password()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Weak Password User',
            'username' => 'weakuser',
            'email' => 'weak@example.com',
            'password' => 'password',
            'role' => 'staff',
        ]);

        $response->assertStatus(400);
        $this->assertDatabaseMissing('users', ['email' => 'weak@example.com']);
    }

    public function test_successful_login()
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('Test@1234'),
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'testuser',
            'password' => 'Test@1234',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'message',
            'data' => [
                'user',
                'tokens' => [
                    'access_token',
                    'refresh_token',
                    'expires_in'
                ]
            ]
        ]);
        $user->refresh();
        $this->assertNotNull($user->last_login);
    }

    public function test_login_with_invalid_password()
    {
        $user = User::factory()->create([
            'username' => 'testuser',
            'password' => bcrypt('Test@1234'),
        ]);

        $response = $this->postJson('/api/login', [
            'username' => 'testuser',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_login_rate_limiting()
    {
        User::factory()->create(['username' => 'testuser', 'password' => bcrypt('Test@1234')]);

        for ($i = 1; $i <= 6; $i++) {
            $response = $this->postJson('/api/login', [
                'username' => 'testuser',
                'password' => 'WrongPassword',
            ]);

            if ($i < 6) {
                $response->assertStatus(401);
            } else {
                $response->assertStatus(429);
                $response->assertHeader('Retry-After');
            }
        }
    }

    public function test_password_reset_request()
    {
        User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200);
    }

    public function test_password_reset_with_valid_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = auth('api')->setTTL(60)
            ->claims([
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => 'password_reset'
            ])
            ->tokenById($user->id);

        PasswordReset::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => Carbon::now()->addMinutes(60),
            'is_used' => false,
        ]);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'password' => 'NewTest_ing!!@108290!!!',
            'password_confirmation' => 'NewTest_ing!!@108290!!!',
        ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewTest_ing!!@108290!!!', $user->fresh()->password));
    }

    public function test_password_reset_with_invalid_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = auth('api')->setTTL(60)
            ->claims([
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => 'password_reset'
            ])
            ->tokenById($user->id);

        PasswordReset::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => Carbon::now()->addMinutes(60),
            'is_used' => false,
        ]);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'invalid_token',
            'password' => 'NewPass_!!!@4819!!',
            'password_confirmation' => 'NewPass_!!!@4819!!',
        ]);

        $response->assertStatus(400);
        $this->assertFalse(Hash::check('NewPass_!!!@4819!!', $user->fresh()->password));
    }

    public function test_password_reset_with_mismatched_passwords()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = auth('api')->setTTL(60)
            ->claims([
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => 'password_reset'
            ])
            ->tokenById($user->id);

        PasswordReset::create([
            'user_id' => $user->id,
            'token' => $token,
            'expires_at' => Carbon::now()->addMinutes(60),
            'is_used' => false,
        ]);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'password' => 'NewPass@123',
            'password_confirmation' => 'DifferentPass@123',
        ]);

        $response->assertStatus(400);
    }
}
