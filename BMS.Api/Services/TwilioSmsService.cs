namespace BMS.Api.Services;

using BMS.Api.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Twilio;
using Twilio.Rest.Api.V2010.Account;
using Twilio.Types;

public class TwilioSmsService : ISmsService
{
    private readonly IConfiguration _config;
    private readonly ILogger<TwilioSmsService> _logger;

    public TwilioSmsService(IConfiguration config, ILogger<TwilioSmsService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendSmsAsync(string phoneNumber, string message)
    {
        var accountSid = _config["Twilio:AccountSid"];
        var authToken = _config["Twilio:AuthToken"];
        var fromNumber = _config["Twilio:FromNumber"];
        var messagingServiceSid = _config["Twilio:MessagingServiceSid"];

        if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || (string.IsNullOrEmpty(fromNumber) && string.IsNullOrEmpty(messagingServiceSid)))
        {
            _logger.LogError("Twilio credentials are missing in configuration.");
            return false;
        }

        try
        {
            TwilioClient.Init(accountSid, authToken);

            var messageOptions = new CreateMessageOptions(new PhoneNumber(phoneNumber))
            {
                Body = message
            };

            if (!string.IsNullOrEmpty(messagingServiceSid))
            {
                messageOptions.MessagingServiceSid = messagingServiceSid;
            }
            else
            {
                messageOptions.From = new PhoneNumber(fromNumber);
            }

            var msg = await MessageResource.CreateAsync(messageOptions);

            if (msg.Status == MessageResource.StatusEnum.Failed || msg.Status == MessageResource.StatusEnum.Undelivered)
            {
                _logger.LogError($"Twilio SMS failed to {phoneNumber}. Status: {msg.Status}, Error: {msg.ErrorMessage}");
                return false;
            }

            _logger.LogInformation($"SMS sent successfully via Twilio to {phoneNumber}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Exception occurred while sending SMS to {phoneNumber} via Twilio");
            return false;
        }
    }
}
