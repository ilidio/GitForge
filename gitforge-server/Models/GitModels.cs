namespace GitForge.Server.Models;

public record GitCommit(string Id, string Author, string Message, DateTimeOffset Timestamp, List<string> Parents);

public record GitFileStatus(string Path, string Status);

public record GitRepoStatus(string BranchName, List<GitFileStatus> Files);

public record GitFileDiff(string Path, string OriginalContent, string ModifiedContent);

public record CommitRequest(string RepoPath, string Message, string AuthorName, string AuthorEmail);