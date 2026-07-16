using PhoneNumbers;
using SupportFlow.Identity.Application.Common.Exceptions;

namespace SupportFlow.Identity.Infrastructure.Common;

public static class PhoneNumberHelper
{
    private static readonly PhoneNumberUtil Util = PhoneNumberUtil.GetInstance();

    public static string ToE164(string phoneNumber)
    {
        try
        {
            var parsed = phoneNumber.Trim().StartsWith('+')
                ? Util.Parse(phoneNumber, null)
                : Util.Parse(phoneNumber, "US");

            if (!Util.IsValidNumber(parsed))
            {
                throw new ConflictException("Enter a valid phone number with country code.");
            }

            return Util.Format(parsed, PhoneNumberFormat.E164);
        }
        catch (NumberParseException)
        {
            throw new ConflictException("Enter a valid phone number with country code (e.g. +923001234567).");
        }
    }
}
