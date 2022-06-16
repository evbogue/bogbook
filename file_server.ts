#!/usr/bin/env -S deno run --allow-net --allow-read
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// This program serves files in the current directory over HTTP.
// TODO(bartlomieju): Add tests like these:
// https://github.com/indexzero/http-server/blob/master/test/http-server-test.js

import { extname, posix } from "https://deno.land/std@0.143.0/path/mod.ts";
import { encode } from "https://deno.land/std@0.143.0/encoding/hex.ts";
import { contentType } from "https://deno.land/std@0.143.0/media_types/mod.ts";
import { serve, serveTls } from "https://deno.land/std@0.143.0/http/server.ts";
import { Status, STATUS_TEXT } from "https://deno.land/std@0.143.0/http/http_status.ts";
import { parse } from "https://deno.land/std@0.143.0/flags/mod.ts";
import { assert } from "https://deno.land/std@0.143.0/_util/assert.ts";
import { red } from "https://deno.land/std@0.143.0/fmt/colors.ts";
import { compareEtag } from "https://deno.land/std@0.143.0/http/util.ts";

const DEFAULT_CHUNK_SIZE = 16_640;

interface EntryInfo {
  mode: string;
  size: string;
  url: string;
  name: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// The fnv-1a hash function.
function fnv1a(buf: string): string {
  let hash = 2166136261; // 32-bit FNV offset basis
  for (let i = 0; i < buf.length; i++) {
    hash ^= buf.charCodeAt(i);
    // Equivalent to `hash *= 16777619` without using BigInt
    // 32-bit FNV prime
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) +
      (hash << 24);
  }
  // 32-bit hex string
  return (hash >>> 0).toString(16);
}

/** Algorithm used to determine etag */
export type EtagAlgorithm =
  | "fnv1a"
  | "sha-1"
  | "sha-256"
  | "sha-384"
  | "sha-512";

// Generates a hash for the provided string
async function createEtagHash(
  message: string,
  algorithm: EtagAlgorithm = "fnv1a",
): Promise<string> {
  if (algorithm === "fnv1a") {
    return fnv1a(message);
  }
  const msgUint8 = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgUint8);
  return decoder.decode(encode(new Uint8Array(hashBuffer)));
}

function modeToString(isDir: boolean, maybeMode: number | null): string {
  const modeMap = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];

  if (maybeMode === null) {
    return "(unknown mode)";
  }
  const mode = maybeMode.toString(8);
  if (mode.length < 3) {
    return "(unknown mode)";
  }
  let output = "";
  mode
    .split("")
    .reverse()
    .slice(0, 3)
    .forEach((v): void => {
      output = `${modeMap[+v]} ${output}`;
    });
  output = `${isDir ? "d" : "-"} ${output}`;
  return output;
}

function fileLenToString(len: number): string {
  const multiplier = 1024;
  let base = 1;
  const suffix = ["B", "K", "M", "G", "T"];
  let suffixIndex = 0;

  while (base * multiplier < len) {
    if (suffixIndex >= suffix.length - 1) {
      break;
    }
    base *= multiplier;
    suffixIndex++;
  }

  return `${(len / base).toFixed(2)}${suffix[suffixIndex]}`;
}

/** Interface for serveFile options. */
export interface ServeFileOptions {
  /** The algorithm to use for generating the ETag. Defaults to "fnv1a". */
  etagAlgorithm?: EtagAlgorithm;
  /** An optional FileInfo object returned by Deno.stat. It is used for optimization purposes. */
  fileInfo?: Deno.FileInfo;
}

/**
 * Returns an HTTP Response with the requested file as the body.
 * @param req The server request context used to cleanup the file handle.
 * @param filePath Path of the file to serve.
 * @param options
 * @param options.etagAlgorithm The algorithm to use for generating the ETag. Defaults to "fnv1a".
 * @param options.fileInfo An optional FileInfo object returned by Deno.stat. It is used
 * for optimization purposes.
 */
export async function serveFile(
  req: Request,
  filePath: string,
  { etagAlgorithm, fileInfo }: ServeFileOptions = {},
): Promise<Response> {
  let file: Deno.FsFile;
  if (fileInfo === undefined) {
    [file, fileInfo] = await Promise.all([
      Deno.open(filePath),
      Deno.stat(filePath),
    ]);
  } else {
    file = await Deno.open(filePath);
  }
  const headers = setBaseHeaders();

  // Set mime-type using the file extension in filePath
  const contentTypeValue = contentType(extname(filePath));
  if (contentTypeValue) {
    headers.set("content-type", contentTypeValue);
  }

  // Set date header if access timestamp is available
  if (fileInfo.atime instanceof Date) {
    const date = new Date(fileInfo.atime);
    headers.set("date", date.toUTCString());
  }

  // Set last modified header if access timestamp is available
  if (fileInfo.mtime instanceof Date) {
    const lastModified = new Date(fileInfo.mtime);
    headers.set("last-modified", lastModified.toUTCString());

    // Create a simple etag that is an md5 of the last modified date and filesize concatenated
    const simpleEtag = await createEtagHash(
      `${lastModified.toJSON()}${fileInfo.size}`,
      etagAlgorithm || "fnv1a",
    );
    headers.set("etag", simpleEtag);

    // If a `if-none-match` header is present and the value matches the tag or
    // if a `if-modified-since` header is present and the value is bigger than
    // the access timestamp value, then return 304
    const ifNoneMatch = req.headers.get("if-none-match");
    const ifModifiedSince = req.headers.get("if-modified-since");
    if (
      (ifNoneMatch && compareEtag(ifNoneMatch, simpleEtag)) ||
      (ifNoneMatch === null &&
        ifModifiedSince &&
        fileInfo.mtime.getTime() < new Date(ifModifiedSince).getTime() + 1000)
    ) {
      const status = Status.NotModified;
      const statusText = STATUS_TEXT[status];

      file.close();

      return new Response(null, {
        status,
        statusText,
        headers,
      });
    }
  }

  // Get and parse the "range" header
  const range = req.headers.get("range") as string;
  const rangeRe = /bytes=(\d+)-(\d+)?/;
  const parsed = rangeRe.exec(range);

  // Use the parsed value if available, fallback to the start and end of the entire file
  const start = parsed && parsed[1] ? +parsed[1] : 0;
  const end = parsed && parsed[2] ? +parsed[2] : fileInfo.size - 1;

  // If there is a range, set the status to 206, and set the "Content-range" header.
  if (range && parsed) {
    headers.set("content-range", `bytes ${start}-${end}/${fileInfo.size}`);
  }

  // Return 416 if `start` isn't less than or equal to `end`, or `start` or `end` are greater than the file's size
  const maxRange = fileInfo.size - 1;

  if (
    range &&
    (!parsed ||
      typeof start !== "number" ||
      start > end ||
      start > maxRange ||
      end > maxRange)
  ) {
    const status = Status.RequestedRangeNotSatisfiable;
    const statusText = STATUS_TEXT[status];

    file.close();

    return new Response(statusText, {
      status,
      statusText,
      headers,
    });
  }

  // Set content length
  const contentLength = end - start + 1;
  headers.set("content-length", `${contentLength}`);
  if (range && parsed) {
    // Create a stream of the file instead of loading it into memory
    let bytesSent = 0;
    const body = new ReadableStream({
      async start() {
        if (start > 0) {
          await file.seek(start, Deno.SeekMode.Start);
        }
      },
      async pull(controller) {
        const bytes = new Uint8Array(DEFAULT_CHUNK_SIZE);
        const bytesRead = await file.read(bytes);
        if (bytesRead === null) {
          file.close();
          controller.close();
          return;
        }
        controller.enqueue(
          bytes.slice(0, Math.min(bytesRead, contentLength - bytesSent)),
        );
        bytesSent += bytesRead;
        if (bytesSent > contentLength) {
          file.close();
          controller.close();
        }
      },
    });

    return new Response(body, {
      status: 206,
      statusText: "Partial Content",
      headers,
    });
  }

  return new Response(file.readable, {
    status: 200,
    statusText: "OK",
    headers,
  });
}

// TODO(bartlomieju): simplify this after deno.stat and deno.readDir are fixed
async function serveDirIndex(
  req: Request,
  dirPath: string,
  options: {
    dotfiles: boolean;
    target: string;
    etagAlgorithm?: EtagAlgorithm;
  },
): Promise<Response> {
  const showDotfiles = options.dotfiles;
  const dirUrl = `/${posix.relative(options.target, dirPath)}`;
  const listEntry: EntryInfo[] = [];

  // if ".." makes sense
  if (dirUrl !== "/") {
    const prevPath = posix.join(dirPath, "..");
    const fileInfo = await Deno.stat(prevPath);
    listEntry.push({
      mode: modeToString(true, fileInfo.mode),
      size: "",
      name: "../",
      url: posix.join(dirUrl, ".."),
    });
  }

  for await (const entry of Deno.readDir(dirPath)) {
    if (!showDotfiles && entry.name[0] === ".") {
      continue;
    }
    const filePath = posix.join(dirPath, entry.name);
    const fileUrl = encodeURI(posix.join(dirUrl, entry.name));
    const fileInfo = await Deno.stat(filePath);
    if (entry.name === "index.html" && entry.isFile) {
      // in case index.html as dir...
      return serveFile(req, filePath, {
        etagAlgorithm: options.etagAlgorithm,
        fileInfo,
      });
    }
    listEntry.push({
      mode: modeToString(entry.isDirectory, fileInfo.mode),
      size: entry.isFile ? fileLenToString(fileInfo.size ?? 0) : "",
      name: `${entry.name}${entry.isDirectory ? "/" : ""}`,
      url: `${fileUrl}${entry.isDirectory ? "/" : ""}`,
    });
  }
  listEntry.sort((a, b) =>
    a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  );
  const formattedDirUrl = `${dirUrl.replace(/\/$/, "")}/`;
  const page = encoder.encode(dirViewerTemplate(formattedDirUrl, listEntry));

  const headers = setBaseHeaders();
  headers.set("content-type", "text/html");

  return new Response(page, { status: Status.OK, headers });
}

function serveFallback(_req: Request, e: Error): Promise<Response> {
  if (e instanceof URIError) {
    return Promise.resolve(
      new Response(STATUS_TEXT[Status.BadRequest], {
        status: Status.BadRequest,
        statusText: STATUS_TEXT[Status.BadRequest],
      }),
    );
  } else if (e instanceof Deno.errors.NotFound) {
    return Promise.resolve(
      new Response(STATUS_TEXT[Status.NotFound], {
        status: Status.NotFound,
        statusText: STATUS_TEXT[Status.NotFound],
      }),
    );
  }

  return Promise.resolve(
    new Response(STATUS_TEXT[Status.InternalServerError], {
      status: Status.InternalServerError,
      statusText: STATUS_TEXT[Status.InternalServerError],
    }),
  );
}

function serverLog(req: Request, status: number): void {
  const d = new Date().toISOString();
  const dateFmt = `[${d.slice(0, 10)} ${d.slice(11, 19)}]`;
  const normalizedUrl = normalizeURL(req.url);
  const s = `${dateFmt} [${req.method}] ${normalizedUrl} ${status}`;
  // using console.debug instead of console.log so chrome inspect users can hide request logs
  console.debug(s);
}

function setBaseHeaders(): Headers {
  const headers = new Headers();
  headers.set("server", "deno");

  // Set "accept-ranges" so that the client knows it can make range requests on future requests
  headers.set("accept-ranges", "bytes");
  headers.set("date", new Date().toUTCString());

  return headers;
}

function dirViewerTemplate(dirname: string, entries: EntryInfo[]): string {
  const paths = dirname.split("/");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>Deno File Server</title>
        <style>
          :root {
            --background-color: #fafafa;
            --color: rgba(0, 0, 0, 0.87);
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --background-color: #292929;
              --color: #fff;
            }
            thead {
              color: #7f7f7f;
            }
          }
          @media (min-width: 960px) {
            main {
              max-width: 960px;
            }
            body {
              padding-left: 32px;
              padding-right: 32px;
            }
          }
          @media (min-width: 600px) {
            main {
              padding-left: 24px;
              padding-right: 24px;
            }
          }
          body {
            background: var(--background-color);
            color: var(--color);
            font-family: "Roboto", "Helvetica", "Arial", sans-serif;
            font-weight: 400;
            line-height: 1.43;
            font-size: 0.875rem;
          }
          a {
            color: #2196f3;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          thead {
            text-align: left;
          }
          thead th {
            padding-bottom: 12px;
          }
          table td {
            padding: 6px 36px 6px 0px;
          }
          .size {
            text-align: right;
            padding: 6px 12px 6px 24px;
          }
          .mode {
            font-family: monospace, monospace;
          }
        </style>
      </head>
      <body>
        <main>
          <h1>Index of
          <a href="/">home</a>${
    paths
      .map((path, index, array) => {
        if (path === "") return "";
        const link = array.slice(0, index + 1).join("/");
        return `<a href="${link}">${path}</a>`;
      })
      .join("/")
  }
          </h1>
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>Size</th>
                <th>Name</th>
              </tr>
            </thead>
            ${
    entries
      .map(
        (entry) => `
                  <tr>
                    <td class="mode">
                      ${entry.mode}
                    </td>
                    <td class="size">
                      ${entry.size}
                    </td>
                    <td>
                      <a href="${entry.url}">${entry.name}</a>
                    </td>
                  </tr>
                `,
      )
      .join("")
  }
          </table>
        </main>
      </body>
    </html>
  `;
}

/** Interface for serveDir options. */
export interface ServeDirOptions {
  /** Serves the files under the given directory root. Defaults to your current directory. */
  fsRoot?: string;
  /** Specified that part is stripped from the beginning of the requested pathname. */
  urlRoot?: string;
  /** Enable directory listing. Defaults to false. */
  showDirListing?: boolean;
  /** Serves dotfiles. Defaults to false. */
  showDotfiles?: boolean;
  /** Enable CORS via the "Access-Control-Allow-Origin" header. Defaults to false. */
  enableCors?: boolean;
  /** Do not print request level logs. Defaults to false. Defaults to false. */
  quiet?: boolean;
  /** The algorithm to use for generating the ETag. Defaults to "fnv1a". */
  etagAlgorithm?: EtagAlgorithm;
}

/**
 * Serves the files under the given directory root (opts.fsRoot).
 *
 * ```ts
 * import { serve } from "https://deno.land/std@$STD_VERSION/http/server.ts";
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * serve((req) => {
 *   const pathname = new URL(req.url).pathname;
 *   if (pathname.startsWith("/static")) {
 *     return serveDir(req, {
 *       fsRoot: "path/to/static/files/dir",
 *     });
 *   }
 *   // Do dynamic responses
 *   return new Response();
 * });
 * ```
 *
 * Optionally you can pass `urlRoot` option. If it's specified that part is stripped from the beginning of the requested pathname.
 *
 * ```ts
 * import { serveDir } from "https://deno.land/std@$STD_VERSION/http/file_server.ts";
 *
 * // ...
 * serveDir(new Request("http://localhost/static/path/to/file"), {
 *   fsRoot: "public",
 *   urlRoot: "static",
 * });
 * ```
 *
 * The above example serves `./public/path/to/file` for the request to `/static/path/to/file`.
 *
 * @param req The request to handle
 * @param opts
 * @param opts.fsRoot Serves the files under the given directory root. Defaults to your current directory.
 * @param opts.urlRoot Specified that part is stripped from the beginning of the requested pathname.
 * @param opts.showDirListing Enable directory listing. Defaults to false.
 * @param opts.showDotfiles Serves dotfiles. Defaults to false.
 * @param opts.enableCors Enable CORS via the "Access-Control-Allow-Origin" header. Defaults to false.
 * @param opts.quiet Do not print request level logs. Defaults to false.
 * @param opts.etagAlgorithm Etag The algorithm to use for generating the ETag. Defaults to "fnv1a".
 */
export async function serveDir(req: Request, opts: ServeDirOptions = {}) {
  let response: Response;
  const target = opts.fsRoot || ".";
  const urlRoot = opts.urlRoot;

  try {
    let normalizedPath = normalizeURL(req.url);
    if (urlRoot) {
      if (normalizedPath.startsWith("/" + urlRoot)) {
        normalizedPath = normalizedPath.replace(urlRoot, "");
      } else {
        throw new Deno.errors.NotFound();
      }
    }

    const fsPath = posix.join(target, normalizedPath);
    const fileInfo = await Deno.stat(fsPath);

    if (fileInfo.isDirectory) {
      if (opts.showDirListing) {
        response = await serveDirIndex(req, fsPath, {
          dotfiles: opts.showDotfiles || false,
          target,
        });
      } else {
        throw new Deno.errors.NotFound();
      }
    } else {
      response = await serveFile(req, fsPath, {
        etagAlgorithm: opts.etagAlgorithm,
        fileInfo,
      });
    }
  } catch (e) {
    const err = e instanceof Error ? e : new Error("[non-error thrown]");
    //console.error(red(err.message));
    response = await serveFallback(req, err);
  }

  if (opts.enableCors) {
    assert(response);
    response.headers.append("access-control-allow-origin", "*");
    response.headers.append(
      "access-control-allow-headers",
      "Origin, X-Requested-With, Content-Type, Accept, Range",
    );
  }

  if (!opts.quiet) serverLog(req, response!.status);

  return response!;
}

function normalizeURL(url: string): string {
  let normalizedUrl = url;

  try {
    //allowed per https://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
    const absoluteURI = new URL(normalizedUrl);
    normalizedUrl = absoluteURI.pathname;
  } catch (e) {
    //wasn't an absoluteURI
    if (!(e instanceof TypeError)) {
      throw e;
    }
  }

  try {
    normalizedUrl = decodeURI(normalizedUrl);
  } catch (e) {
    if (!(e instanceof URIError)) {
      throw e;
    }
  }

  if (normalizedUrl[0] !== "/") {
    throw new URIError("The request URI is malformed.");
  }

  normalizedUrl = posix.normalize(normalizedUrl);
  const startOfParams = normalizedUrl.indexOf("?");

  return startOfParams > -1
    ? normalizedUrl.slice(0, startOfParams)
    : normalizedUrl;
}

function main(): void {
  const serverArgs = parse(Deno.args, {
    string: ["port", "host", "cert", "key"],
    boolean: ["help", "dir-listing", "dotfiles", "cors", "verbose"],
    negatable: ["dir-listing", "dotfiles", "cors"],
    default: {
      "dir-listing": true,
      dotfiles: true,
      cors: true,
      verbose: false,
      host: "0.0.0.0",
      port: "4507",
      cert: "",
      key: "",
    },
    alias: {
      p: "port",
      c: "cert",
      k: "key",
      h: "help",
      v: "verbose",
    },
  });
  const port = serverArgs.port;
  const host = serverArgs.host;
  const certFile = serverArgs.cert;
  const keyFile = serverArgs.key;

  if (serverArgs.help) {
    printUsage();
    Deno.exit();
  }

  if (keyFile || certFile) {
    if (keyFile === "" || certFile === "") {
      console.log("--key and --cert are required for TLS");
      printUsage();
      Deno.exit(1);
    }
  }

  const wild = serverArgs._ as string[];
  const target = posix.resolve(wild[0] ?? "");

  const handler = (req: Request): Promise<Response> => {
    return serveDir(req, {
      fsRoot: target,
      showDirListing: serverArgs["dir-listing"],
      showDotfiles: serverArgs.dotfiles,
      enableCors: serverArgs.cors,
      quiet: !serverArgs.verbose,
    });
  };

  const useTls = Boolean(keyFile || certFile);

  if (useTls) {
    serveTls(handler, {
      port: Number(port),
      hostname: host,
      certFile,
      keyFile,
    });
  } else {
    serve(handler, { port: Number(port), hostname: host });
  }
}

function printUsage() {
  console.log(`Deno File Server
  Serves a local directory in HTTP.

INSTALL:
  deno install --allow-net --allow-read https://deno.land/std/http/file_server.ts

USAGE:
  file_server [path] [options]

OPTIONS:
  -h, --help          Prints help information
  -p, --port <PORT>   Set port
  --cors              Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>   Hostname (default is 0.0.0.0)
  -c, --cert <FILE>   TLS certificate file (enables TLS)
  -k, --key  <FILE>   TLS key file (enables TLS)
  --no-dir-listing    Disable directory listing
  --no-dotfiles       Do not show dotfiles
  --no-cors           Disable cross-origin resource sharing
  -v, --verbose       Print request level logs

  All TLS options are required when one is provided.`);
}

if (import.meta.main) {
  main();
}
