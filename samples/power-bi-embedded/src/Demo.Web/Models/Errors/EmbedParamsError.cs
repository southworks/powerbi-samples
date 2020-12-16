namespace Demo.Web.Models.Errors
{
    public class EmbedParamsError
    {
        private readonly string message;

        public string Message
        {
            get { return this.message; }
        }

        public EmbedParamsError(string message)
        {
            this.message = message;
        }
    }
}
