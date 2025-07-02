<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Support\Str;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $displayToken;
    public $actualToken;
    public $resetUrl;
    public $emailId;

    /**
     * Create a new message instance.
     *
     * @param string $displayToken Short token for display
     * @param string $actualToken Full token for authentication
     * @return void
     */
    public function __construct($displayToken, $actualToken)
    {
        $this->displayToken = $displayToken;
        $this->actualToken = $actualToken;
        
        // Generate a unique tracking ID for this email
        $this->emailId = Str::uuid()->toString();
        
        // Create the reset URL with tracking parameters
        $baseUrl = url('/reset-password');
        $url = $baseUrl . '?token=' . $actualToken;
        
        // Add tracking parameters
        $trackingParams = [
            'utm_source' => 'email',
            'utm_medium' => 'password_reset',
            'utm_campaign' => 'account_recovery',
            'email_id' => $this->emailId
        ];
        
        $this->resetUrl = $this->addTrackingParams($url, $trackingParams);
    }

    /**
     * Add tracking parameters to a URL
     *
     * @param string $url
     * @param array $params
     * @return string
     */
    protected function addTrackingParams($url, $params)
    {
        $parts = parse_url($url);
        
        // Start with the existing query parameters, if any
        $query = isset($parts['query']) ? $parts['query'] : '';
        parse_str($query, $queryParams);
        
        // Add our tracking parameters
        foreach ($params as $key => $value) {
            $queryParams[$key] = $value;
        }
        
        // Rebuild the URL with the new parameters
        $newQuery = http_build_query($queryParams);
        
        // Reconstruct the URL
        $scheme = isset($parts['scheme']) ? $parts['scheme'] . '://' : '';
        $host = isset($parts['host']) ? $parts['host'] : '';
        $port = isset($parts['port']) ? ':' . $parts['port'] : '';
        $path = isset($parts['path']) ? $parts['path'] : '';
        $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';
        
        return $scheme . $host . $port . $path . '?' . $newQuery . $fragment;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        return $this->subject('Reset Your Password')
                    ->view('emails.reset-password')
                    ->with([
                        'emailType' => 'password_reset',
                        'emailId' => $this->emailId
                    ]);
    }
}