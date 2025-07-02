<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Str;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\URL;
use Jenssegers\Agent\Agent;
use Illuminate\Contracts\Queue\ShouldQueue;

class PasswordChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * The user instance.
     *
     * @var \App\Models\User
     */
    public $user;

    /**
     * Email tracking ID.
     *
     * @var string
     */
    public $emailId;

    /**
     * Email type.
     *
     * @var string
     */
    public $emailType = 'password_changed';

    /**
     * The device information.
     *
     * @var string
     */
    public $device;

    /**
     * The change timestamp.
     *
     * @var string
     */
    public $change_time;

    /**
     * The account activity URL.
     *
     * @var string
     */
    public $account_activity_url;

    /**
     * Create a new message instance.
     *
     * @param  \App\Models\User  $user
     * @param  array  $data  Additional data to include in the email
     * @return void
     */
    public function __construct(User $user, array $data = [])
    {
        $this->user = $user;
        $this->emailId = $data['email_id'] ?? (string) Str::uuid();
        $this->change_time = $data['change_time'] ?? now()->format('M d, Y - h:i A');
        
        // Extract device info
        $agent = new Agent();
        $agent->setUserAgent($data['user_agent'] ?? request()->userAgent() ?? 'Unknown');
        
        $browser = $agent->browser();
        $platform = $agent->platform();
        $this->device = "{$browser} on {$platform}";
        
        // Set account activity URL
        $this->account_activity_url = $data['account_activity_url'] ?? 
            URL::signedRoute('account.activity', ['user' => $user->id]);
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Your Password Has Been Changed')
            ->view('emails.password-changed')
            ->with([
                'emailId' => $this->emailId,
                'emailType' => $this->emailType,
                'device' => $this->device,
                'change_time' => $this->change_time,
                'account_activity_url' => $this->account_activity_url,
            ]);
    }
} 